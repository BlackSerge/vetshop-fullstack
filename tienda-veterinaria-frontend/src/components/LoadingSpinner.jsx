import { useThemeStore } from '../store/useThemeStore';

const LoadingSpinner = () => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  const spinnerColor = isDark ? "border-purple-400" : "border-purple-500";
  const outerColor = isDark ? "border-gray-600" : "border-gray-300";

  return (
    <div className="flex justify-center items-center">
      <div
        className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid ${spinnerColor} border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${outerColor}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
export default LoadingSpinner;