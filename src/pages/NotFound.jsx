export default function NotFound() {
  return (

     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="container max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 my-5">
          {/* Bagian Kiri - Gambar */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img 
              src="/assets/image/404.png" 
              alt="404" 
              className="h-90 max-w-xl object-contain"
            />
          </div>
          
          {/* Bagian Kanan - Konten */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <h1 className="text-3xl md:text-6xl font-bold text-gray-800">
                    404
                </h1>
            </div>
            
            <h2 className="text-xl md:text-3xl font-semibold text-gray-700 mb-3">
              Page Not Found
            </h2>
            
            <p className="text-gray-600 mb-6">
              URL not available.
            </p>
            
            <button 
              onClick={() => window.location.href = '/'}
              className=" bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-6"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
    
  );
}
