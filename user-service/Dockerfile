# Imagen oficial de Node.js
FROM node:18

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos archivos del proyecto
COPY . .

# Instalamos dependencias
RUN npm install

# Exponemos el puerto del user-service
EXPOSE 3002

# Iniciamos el servidor
CMD ["node", "server.js"]