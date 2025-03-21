# Gunakan image Node.js untuk membangun aplikasi
FROM node:18 AS build

# Atur direktori kerja dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Salin semua kode sumber ke dalam container
COPY . .

# Build aplikasi React
RUN npm run build

# Gunakan image Nginx untuk menjalankan aplikasi React
FROM nginx:1.23

# Salin file build ke dalam direktori default Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
