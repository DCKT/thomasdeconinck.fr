import useDarkMode from "use-dark-mode";

export default function DarkModeToggler() {
  const darkMode = useDarkMode(false, {
    classNameDark: "dark",
    element: (typeof document !== "undefined" && document.documentElement) || {
      classList: {
        add: () => {},
        remove: () => {},
      },
    },
  });

  return (
    <div className="dark-mode-toggle">
      <button
        type="button"
        onClick={darkMode.disable}
        className="opacity-1 dark:opacity-50 mr-1"
      >
        ☀
      </button>
      <span className="toggle-control">
        <input
          className="dmcheck"
          type="checkbox"
          checked={darkMode.value}
          onChange={darkMode.toggle}
          id="dmcheck"
        />
        <label htmlFor="dmcheck" />
      </span>
      <button
        type="button"
        onClick={darkMode.enable}
        className="text-gray-400 dark:text-yellow-400 ml-1"
      >
        ☾
      </button>
    </div>
  );
}
