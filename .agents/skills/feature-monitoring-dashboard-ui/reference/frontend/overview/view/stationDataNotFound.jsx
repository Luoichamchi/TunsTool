const DEFAULT_TITLE = "Không tìm thấy dữ liệu trạm";
const DEFAULT_DESCRIPTION =
  "Dữ liệu quan trắc cho trạm này hiện chưa có hoặc đang được cập nhật. Vui lòng kiểm tra lại sau hoặc chọn trạm khác.";

export const StationDataNotFound = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 100px)",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        padding: "40px 24px",
        margin: 0,
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 24 }}
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="#f5f5f5"
          stroke="#bdbdbd"
          strokeWidth="2"
        />
        <path
          d="M40 22V44"
          stroke="#bdbdbd"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="40" cy="56" r="3.5" fill="#bdbdbd" />
      </svg>
      <h2
        style={{
          color: "#255883",
          fontWeight: 700,
          fontSize: "1.5rem",
          margin: 0,
          marginBottom: 8,
          fontFamily: "'Source Sans Pro', sans-serif",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#555",
          fontSize: "1rem",
          margin: 0,
          textAlign: "center",
          maxWidth: 340,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
};
