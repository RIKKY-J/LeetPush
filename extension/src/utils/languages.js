/**
 * LeetPush Language Support & Extension Mapping
 */
const LEETPUSH_LANGUAGES = {
  python: { ext: "py", name: "Python" },
  python3: { ext: "py", name: "Python 3" },
  py: { ext: "py", name: "Python" },
  cpp: { ext: "cpp", name: "C++" },
  "c++": { ext: "cpp", name: "C++" },
  c: { ext: "c", name: "C" },
  java: { ext: "java", name: "Java" },
  javascript: { ext: "js", name: "JavaScript" },
  js: { ext: "js", name: "JavaScript" },
  typescript: { ext: "ts", name: "TypeScript" },
  ts: { ext: "ts", name: "TypeScript" },
  go: { ext: "go", name: "Go" },
  golang: { ext: "go", name: "Go" },
  rust: { ext: "rs", name: "Rust" },
  rs: { ext: "rs", name: "Rust" },
  kotlin: { ext: "kt", name: "Kotlin" },
  swift: { ext: "swift", name: "Swift" },
  csharp: { ext: "cs", name: "C#" },
  "c#": { ext: "cs", name: "C#" },
  php: { ext: "php", name: "PHP" },
  ruby: { ext: "rb", name: "Ruby" },
  scala: { ext: "scala", name: "Scala" },
  dart: { ext: "dart", name: "Dart" },
  elixir: { ext: "ex", name: "Elixir" },
  erlang: { ext: "erl", name: "Erlang" },
  racket: { ext: "rkt", name: "Racket" },
  mysql: { ext: "sql", name: "MySQL" },
  "ms sql server": { ext: "sql", name: "MS SQL" },
  oracle: { ext: "sql", name: "Oracle SQL" },
  postgresql: { ext: "sql", name: "PostgreSQL" },
  pandas: { ext: "py", name: "Pandas (Python)" },
  bash: { ext: "sh", name: "Bash" }
};

function getLanguageExtension(language) {
  if (!language) return "txt";
  const key = language.toLowerCase().trim();
  return LEETPUSH_LANGUAGES[key]?.ext || "txt";
}

function getLanguageDisplayName(language) {
  if (!language) return "Unknown";
  const key = language.toLowerCase().trim();
  return LEETPUSH_LANGUAGES[key]?.name || language;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LEETPUSH_LANGUAGES,
    getLanguageExtension,
    getLanguageDisplayName
  };
}
