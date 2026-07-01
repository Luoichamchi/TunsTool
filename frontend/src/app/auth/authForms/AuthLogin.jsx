"use client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserDataContext } from "@/app/context/UserDataContext";
import { useTenant } from "@/app/context/TenantContext";
import { isIpHostname } from "@/app/utils/tenantHostname";

const TENANT_CODE_KEY = "tenant_code";

const readSavedTenantCode = () => {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(TENANT_CODE_KEY) || "").trim().toLowerCase();
};

const MOBILE_ACCENT = "#008000";

const mobileLabelSx = {
  color: "#3d5a6e",
  fontWeight: 500,
  fontSize: "0.9rem",
  mb: 0.25,
  mt: 0,
};

/** Label ô thứ 2 trở đi — sát ô phía trên */
const mobileLabelCompactSx = {
  ...mobileLabelSx,
  mt: 1.5,
};

const mobileFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "#fff",
    minHeight: 46,
    fontSize: "0.95rem",
    "& fieldset": {
      borderColor: "#cfd9e2",
    },
    "&:hover fieldset": {
      borderColor: "#9bb8cc",
    },
    "&.Mui-focused fieldset": {
      borderColor: MOBILE_ACCENT,
      borderWidth: 1,
    },
  },
};

const mobileButtonSx = {
  mt: 2.5,
  borderRadius: "8px",
  minHeight: 48,
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  bgcolor: MOBILE_ACCENT,
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#006600",
    boxShadow: "none",
  },
};

const AuthLogin = ({ title, subtitle, subtext, isMobile = false }) => {
  const isIpAccess =
    typeof window !== "undefined" && isIpHostname(window.location.hostname);

  const [step, setStep] = useState("tenant");
  const [orgCode, setOrgCode] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(UserDataContext);
  const {
    tenantCode,
    setTenantCode,
    clearTenantCode,
    hasSubdomain,
    isLoading: tenantLoading,
  } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (tenantLoading) return;

    if (!isIpAccess) {
      if (tenantCode) {
        setSelectedOrg(tenantCode);
        setStep("login");
      }
      return;
    }

    const savedCode = (tenantCode || readSavedTenantCode()).trim().toLowerCase();
    if (savedCode) {
      setSelectedOrg(savedCode);
      setStep("login");
      return;
    }

    setStep("tenant");
    setOrgCode("");
  }, [tenantCode, hasSubdomain, tenantLoading, isIpAccess]);

  const handleTenantContinue = async (e) => {
    e.preventDefault();
    const code = orgCode.trim().toLowerCase();
    if (!code) {
      setError("Vui lòng nhập mã tổ chức");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tenant/check/${encodeURIComponent(code)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Mã tổ chức không tồn tại");
      }
      const data = await res.json();
      const resolvedCode = data.tenant_code || code;
      setTenantCode(resolvedCode);
      setSelectedOrg(resolvedCode);
      setStep("login");
    } catch (err) {
      setError(err.message || "Không thể xác minh mã tổ chức");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTenant = () => {
    if (!isIpAccess) return;
    clearTenantCode();
    setSelectedOrg("");
    setOrgCode("");
    setError(null);
    setStep("tenant");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const code = selectedOrg || tenantCode;
    if (!code) {
      setError("Chưa chọn mã tổ chức");
      if (isIpAccess) setStep("tenant");
      return;
    }
    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await login(username, password, code);
    setLoading(false);

    if (result.success) {
      router.push("/apps/dining-tables");
    } else {
      setError(result.message || "Đăng nhập thất bại");
    }
  };

  if (tenantLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isIpAccess && step === "tenant") {
    return (
      <form onSubmit={handleTenantContinue} autoComplete="off">
        {!isMobile && subtext}

        <Stack sx={{ mt: isMobile ? 0 : 1 }} spacing={isMobile ? 2 : 0}>
          <Box>
            <CustomFormLabel
              htmlFor="tenant_code"
              sx={isMobile ? mobileLabelSx : undefined}
            >
              {isMobile ? "Mã tổ chức" : "Mã tổ chức (Tenant Code)"}
            </CustomFormLabel>
            <CustomTextField
              id="tenant_code"
              variant="outlined"
              fullWidth
              placeholder={isMobile ? "Nhập mã tổ chức" : undefined}
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              autoComplete="off"
              autoFocus
              disabled={loading}
              sx={isMobile ? mobileFieldSx : undefined}
            />
          </Box>
        </Stack>

        {error && (
          <Typography
            color="error"
            sx={{ mt: 1.5, fontSize: isMobile ? "0.85rem" : undefined }}
          >
            {error}
          </Typography>
        )}

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={loading}
          sx={isMobile ? mobileButtonSx : { mt: 3 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Tiếp tục"
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} autoComplete="off">
      {!isMobile && title ? (
        <Typography variant="h3" sx={{ fontWeight: "700", mb: 1 }}>
          {title}
        </Typography>
      ) : null}

      {!isMobile && subtext}

      {isIpAccess && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            mb: isMobile ? 1.5 : 2,
            mt: isMobile ? 0 : 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: isMobile ? "#3d5a6e" : undefined }}
            color={isMobile ? undefined : "textSecondary"}
          >
            Tổ chức:
          </Typography>
          <Chip
            label={selectedOrg || tenantCode}
            size="small"
            sx={
              isMobile
                ? {
                    bgcolor: "#f0faf0",
                    color: MOBILE_ACCENT,
                    fontWeight: 600,
                    border: `1px solid ${MOBILE_ACCENT}`,
                  }
                : undefined
            }
            color={isMobile ? "default" : "primary"}
          />
          <Typography
            variant="body2"
            sx={{
              color: MOBILE_ACCENT,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: isMobile ? "0.85rem" : undefined,
            }}
            onClick={handleChangeTenant}
          >
            Đổi
          </Typography>
        </Stack>
      )}

      <Stack spacing={isMobile ? 0 : 0}>
        <Box>
          <CustomFormLabel
            htmlFor="username"
            sx={isMobile ? mobileLabelSx : undefined}
          >
            Tên đăng nhập
          </CustomFormLabel>
          <CustomTextField
            id="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            disabled={loading}
            sx={isMobile ? mobileFieldSx : undefined}
          />
        </Box>
        <Box sx={isMobile ? { mt: 0 } : undefined}>
          <CustomFormLabel
            htmlFor="password"
            sx={isMobile ? mobileLabelCompactSx : undefined}
          >
            Mật khẩu
          </CustomFormLabel>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            sx={isMobile ? mobileFieldSx : undefined}
          />
        </Box>
        {!isMobile && (
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <FormGroup>
              <FormControlLabel
                control={<CustomCheckbox defaultChecked disabled={loading} />}
                label="Nhớ thiết bị này"
              />
            </FormGroup>
          </Stack>
        )}
      </Stack>

      {error && (
        <Typography
          color="error"
          sx={{ mt: 1.5, fontSize: isMobile ? "0.85rem" : undefined }}
        >
          {error}
        </Typography>
      )}

      <Button
        color="primary"
        variant="contained"
        size="large"
        fullWidth
        type="submit"
        disabled={loading}
        sx={isMobile ? mobileButtonSx : { mt: 2 }}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      {!isMobile && subtitle}
    </form>
  );
};

export default AuthLogin;
