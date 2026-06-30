"use client";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Switch,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function PermissionCard({
  permissions,
  editPerms,
  loading,
  onToggle,
  readOnly = false,
}) {
  const theme = useTheme();

  if (permissions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography color="text.secondary">Không có quyền nào</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {permissions.map((perm) => {
        const checked = editPerms.some(
          (rp) => (rp.permission_id || rp.id) === perm.id,
        );
        return (
          <Card
            key={perm.id}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderLeft: checked
                ? `4px solid ${theme.palette.success.main}`
                : `4px solid ${theme.palette.grey[400]}`,
            }}
          >
            <CardContent
              sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ mb: 0.25 }}
                  >
                    {perm.name}
                  </Typography>
                  {perm.description && (
                    <Typography variant="caption" color="text.secondary">
                      {perm.description}
                    </Typography>
                  )}
                </Box>
                <Switch
                  checked={checked}
                  onChange={() => onToggle(perm.id)}
                  color={checked ? "success" : "default"}
                  disabled={loading || readOnly}
                />
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
