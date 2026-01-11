const RerunLoadingModal = ({ open, progress, name }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[800px] text-center">
        <h1 className="text-2xl font-semibold mb-2">Re-running {name}</h1>
        <p className="text-sm text-gray-500 mb-4 italic">Please wait while the test case is being executed.</p>

        <div className="w-full shadow-xl rounded-full">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-[#FFCC81] h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>


        <p className="text-sm mt-3">{progress}%</p>
      </div>
    </div>
  );
};

export default RerunLoadingModal;
