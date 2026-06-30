"use client";
import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PageContainer from "@/app/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import AuthLogin from "../../authForms/AuthLogin";
import LoginMobileShell from "../../mobile/LoginMobileShell";
import useIsMobile from "@/app/utils/hooks/useIsMobile";

export default function Login() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <PageContainer title="Login Page" description="Đăng nhập VIMON">
        <LoginMobileShell>
          <AuthLogin isMobile />
        </LoginMobileShell>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Login Page" description="this is Sample page">
      <Grid
        container
        spacing={0}
        sx={{
          justifyContent: "center",
          height: "100dvh",
        }}
      >
        <Grid
          sx={{
            position: "relative",
            "&:before": {
              content: '""',
              background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
              backgroundSize: "400% 400%",
              animation: "gradient 15s ease infinite",
              position: "absolute",
              height: "100%",
              width: "100%",
              opacity: "0.3",
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 7,
            xl: 8,
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Box sx={{ px: 3 }}>
              <Logo />
            </Box>
            <Box
              sx={{
                alignItems: "center",
                justifyContent: "center",
                height: "calc(100vh - 75px)",
                display: { xs: "none", lg: "flex" },
              }}
            >
              <img
                src="/images/backgrounds/login-bg.svg"
                alt="bg"
                width={500}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  maxHeight: "500px",
                }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, lg: 5, xl: 4 }}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box sx={{ p: 4 }}>
            <AuthLogin
              subtext={
                <Typography
                  variant="subtitle1"
                  color="textSecondary"
                  sx={{ mb: 1, textAlign: "center" }}
                >
                  <img
                    src="/images/logos/logo-vimon.png"
                    alt="logo"
                    width={300}
                    style={{
                      marginTop: "20px",
                      display: "block",
                      margin: "20px auto 0",
                    }}
                  />
                </Typography>
              }
              subtitle={
                <Stack direction="row" spacing={1} sx={{ mt: 3 }} />
              }
            />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
