# Usamos una imagen oficial de Node.js
FROM node:18

# Creamos carpeta dentro del contenedor
WORKDIR /app

# Copiamos todos los archivos del proyecto
COPY . .

# Instalamos dependencias
RUN npm install

# Exponemos el puerto del microservicio
EXPOSE 3001

# Comando para iniciar el servidor
CMD ["node", "server.js"]