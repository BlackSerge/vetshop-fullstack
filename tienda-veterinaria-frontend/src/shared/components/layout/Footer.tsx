
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-6 mt-auto">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} VetShop. Todos los derechos reservados.</p>
        <p className="text-sm text-gray-400 mt-2">
          Desarrollado con ❤️ para Daniela 
        </p>
      </div>
    </footer>
  );
}
