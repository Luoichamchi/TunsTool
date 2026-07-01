import { useContext, useEffect } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

const LANGUAGES = [
  {
    flagname: "Tiếng việt",
    icon: "/images/flag/icon-flag-vi.svg",
    value: "vi",
  },
  {
    flagname: "English",
    icon: "/images/flag/icon-flag-en.svg",
    value: "en",
  },
];

const StyledBox = styled(Box)(({ theme }) => ({
  boxShadow: theme.shadows[8],
  padding: "12px 16px",
  cursor: "pointer",
  justifyContent: "center",
  display: "flex",
  transition: "0.1s ease-in",
  border: "1px solid rgba(145, 158, 171, 0.12)",
  flex: 1,
  minWidth: 0,
  "&:hover": {
    transform: "scale(1.02)",
  },
}));

const LanguageSettings = () => {
  const { isLanguage, setIsLanguage } = useContext(CustomizerContext);
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(isLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("customizer_language", isLanguage);
    }
  }, [isLanguage, i18n]);

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Language
      </Typography>
      <Stack direction="row" gap={2} my={2}>
        {LANGUAGES.map((option) => (
          <StyledBox
            key={option.value}
            onClick={() => setIsLanguage(option.value)}
            display="flex"
            gap={1}
            alignItems="center"
            sx={{
              borderColor:
                isLanguage === option.value ? "primary.main" : undefined,
              borderWidth: isLanguage === option.value ? 2 : 1,
            }}
          >
            <Avatar
              src={option.icon}
              alt={option.value}
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="body2">{option.flagname}</Typography>
          </StyledBox>
        ))}
      </Stack>
    </>
  );
};

export default LanguageSettings;
