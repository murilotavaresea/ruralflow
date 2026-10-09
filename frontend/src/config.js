function normalizeBaseUrl(url) {
  if (!url) {
    return "";
  }

  return url.replace(/\/+$/, "");
}

function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:5001";
  }

  const { hostname } = window.location;
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

  if (isLocalhost) {
    return "http://localhost:5001";
  }

  return "";
}

const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_BASE_URL || getDefaultApiBaseUrl()
);

const config = {
  API_BASE_URL,
  REFERENCIA_URL: `${API_BASE_URL}/referencia`,
};

export default config;
