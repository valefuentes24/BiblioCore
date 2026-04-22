// Importamos el modelo
const Book = require("../models/Book");


// Obtener todos los libros
exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};

const GOOGLE_BOOKS_MAX_PAGE_SIZE = 40;

/**
 * Google no siempre incluye imageLinks; a veces solo smallThumbnail o tamaños mayores.
 * Las URLs a veces vienen en http y el navegador las bloquea en páginas https.
 */
function pickCoverUrlFromGoogle(imageLinks) {
  if (!imageLinks || typeof imageLinks !== "object") return "";
  const raw =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    "";
  if (!raw || typeof raw !== "string") return "";
  return raw.replace(/^http:\/\//i, "https://");
}

function volumeToBook(item) {
  const coverUrl = pickCoverUrlFromGoogle(item.volumeInfo?.imageLinks);
  return {
    id: item.id,
    title: item.volumeInfo?.title || "Sin título",
    author: item.volumeInfo?.authors?.[0] || "Autor desconocido",
    coverUrl,
    categoryLabel: item.volumeInfo?.categories?.[0] || null,
    available: true,
  };
}

/** Cada petición a Google pide hasta 40 volúmenes; reintentamos hacia adelante hasta llenar con portada. */
const GOOGLE_FETCH_SIZE = 40;
const MAX_COVER_SCAN_BATCHES = 12;

function buildGoogleBooksUrl(query, orderBy, startIndex, apiKey) {
  let baseUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query
  )}&maxResults=${GOOGLE_FETCH_SIZE}&orderBy=${orderBy}&startIndex=${startIndex}`;
  return apiKey ? `${baseUrl}&key=${apiKey}` : baseUrl;
}

/**
 * Máximo índice de página (1-based) que enviamos a Google Books por petición.
 * El frontend agrupa varias páginas API por cada "vista" UI (p. ej. 2 → hace falta 2×N vistas API).
 * Si el frontend muestra más vistas que esto permita, las peticiones se recortan y el grid queda vacío.
 */
const GOOGLE_BOOKS_MAX_PAGES = 40;

// Buscar libros en Google Books API
exports.searchExternalBooks = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({ message: "Debes enviar el parámetro q" });
    }

    const maxResults = Math.min(
      Math.max(parseInt(req.query.maxResults, 10) || GOOGLE_BOOKS_MAX_PAGE_SIZE, 1),
      GOOGLE_BOOKS_MAX_PAGE_SIZE
    );
    const orderBy =
      req.query.orderBy === "newest" ? "newest" : "relevance";

    let page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    page = Math.min(page, GOOGLE_BOOKS_MAX_PAGES);

    let googleStart;
    if (req.query.startIndex !== undefined && req.query.startIndex !== "") {
      const si = parseInt(req.query.startIndex, 10);
      googleStart = Number.isNaN(si) || si < 0 ? 0 : si;
    } else {
      googleStart = (page - 1) * maxResults;
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const collected = [];
    const seenIds = new Set();
    let totalItems = 0;
    let googlePos = googleStart;
    let batches = 0;
    let lastRawCount = 0;

    while (collected.length < maxResults && batches < MAX_COVER_SCAN_BATCHES) {
      batches += 1;
      const url = buildGoogleBooksUrl(query, orderBy, googlePos, apiKey);
      const response = await fetch(url);

      if (!response.ok) {
        return res.status(502).json({
          error: "Google Books no respondió correctamente",
          googleStatus: response.status,
          googleStatusText: response.statusText,
        });
      }

      const data = await response.json();
      if (batches === 1) {
        totalItems = typeof data.totalItems === "number" ? data.totalItems : 0;
      }

      const rawItems = data.items || [];
      lastRawCount = rawItems.length;
      if (rawItems.length === 0) break;

      for (const item of rawItems) {
        const book = volumeToBook(item);
        if (!book.coverUrl) continue;
        if (seenIds.has(book.id)) continue;
        seenIds.add(book.id);
        collected.push(book);
        if (collected.length >= maxResults) break;
      }

      googlePos += rawItems.length;
      if (rawItems.length < GOOGLE_FETCH_SIZE) break;
    }

    const books = collected.slice(0, maxResults);
    const nextStartIndex = googlePos;

    let totalPages;
    if (totalItems > 0) {
      totalPages = Math.min(
        GOOGLE_BOOKS_MAX_PAGES,
        Math.max(1, Math.ceil(totalItems / maxResults))
      );
    } else if (books.length === maxResults || lastRawCount === GOOGLE_FETCH_SIZE) {
      totalPages = Math.min(GOOGLE_BOOKS_MAX_PAGES, page + 1);
    } else {
      totalPages = Math.max(1, page);
    }
    const hasNextPage =
      totalItems > 0
        ? googlePos < totalItems
        : lastRawCount >= GOOGLE_FETCH_SIZE;

    return res.json({
      items: books,
      page,
      pageSize: maxResults,
      totalItems,
      totalPages,
      hasNextPage,
      maxPages: GOOGLE_BOOKS_MAX_PAGES,
      nextStartIndex,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al buscar libros externos" });
  }
};


// Crear un libro
exports.createBook = async (req, res) => {
  const book = new Book(req.body);

  // Si la cantidad es 0, lo marcamos como no disponible
  if (book.quantity === 0) {
    book.available = false;
  }

  await book.save();
  res.json(book);
};


//  PRESTAR LIBRO
exports.loanBook = async (req, res) => {
  try {
    // Buscamos el libro por ID
    const book = await Book.findById(req.params.id);

    // Si no existe
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Si no hay cantidad disponible
    if (book.quantity <= 0) {
      return res.status(400).json({ message: "No hay libros disponibles" });
    }

    // Disminuimos la cantidad
    book.quantity -= 1;

    // Si ya no quedan, lo marcamos como no disponible
    if (book.quantity === 0) {
      book.available = false;
    }

    await book.save();

    res.json({
      message: "Libro prestado correctamente",
      book
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//  DEVOLVER LIBRO
exports.returnBook = async (req, res) => {
  try {
    // Buscamos el libro
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Aumentamos la cantidad
    book.quantity += 1;

    // Al haber al menos uno, está disponible
    book.available = true;

    await book.save();

    res.json({
      message: "Libro devuelto correctamente",
      book
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }
    res.json({ message: "Libro eliminado", id: book._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};