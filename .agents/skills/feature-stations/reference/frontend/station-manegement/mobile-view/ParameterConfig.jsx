"use client";
import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Autocomplete,
  IconButton,
  Fab,
  Divider,
} from "@mui/material";
import {
  IconChevronUp,
  IconChevronDown,
  IconChevronRight,
  IconTrash,
} from "@tabler/icons-react";
import AddIcon from "@mui/icons-material/Add";
import { SketchPicker } from "react-color";

export default function ParameterConfig({
  configRows,
  parameterSuggestions,
  onAddRow,
  onDeleteRow,
  onRowChange,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [displayColorPicker, setDisplayColorPicker] = useState({});

  const toggleExpand = (row_id) => {
    setExpandedId((prev) => (prev === row_id ? null : row_id));
  };

  const handleColorSwatchClick = (row_id) => {
    setDisplayColorPicker((prev) => ({ ...prev, [row_id]: !prev[row_id] }));
  };

  const handleColorClose = (row_id) => {
    setDisplayColorPicker((prev) => ({ ...prev, [row_id]: false }));
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5} sx={{ pr: 0.5 }}>
      {configRows.length === 0 && (
        <Typography align="center" color="text.secondary" py={3}>
          Chưa có thông số nào
        </Typography>
      )}

      {configRows.map((row, idx) => {
        const isOpen = expandedId === row.row_id;

        return (
          <Box
            key={row.row_id}
            sx={{
          
              border: "1px solid",
              borderColor: isOpen ? "primary.main" : "divider",
            }}
          >
            {/* ── HEADER ── */}
            <Box
              onClick={() => toggleExpand(row.row_id)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.25,
                bgcolor: isOpen ? "primary.main" : "background.paper",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color={isOpen ? "white" : "text.primary"}
              >
                {idx + 1} -{" "}
                {row.parameter_name || row.parameter_code || "Chưa chọn"}
              </Typography>

              <Box display="flex" alignItems="center" gap={0.5}>
                {isOpen && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRow(row.row_id);
                    }}
                    sx={{ color: "white", p: 0.25 }}
                  >
                    <IconTrash size={18} />
                  </IconButton>
                )}
                {isOpen ? (
                  <IconChevronUp
                    size={18}
                    color={isOpen ? "white" : undefined}
                  />
                ) : (
                  <IconChevronRight size={18} />
                )}
              </Box>
            </Box>

            {/* ── BODY (expanded) ── */}
            {isOpen && (
              <Box
                px={2}
                py={1.5}
                display="flex"
                flexDirection="column"
                gap={1.25}
              >
                {/* Mã thông số */}
                <FieldRow label="Mã thông số">
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={parameterSuggestions}
                    getOptionLabel={(o) => o.parameter_code || ""}
                    isOptionEqualToValue={(o, v) =>
                      o.parameter_code === v.parameter_code
                    }
                    value={
                      parameterSuggestions.find(
                        (p) => p.parameter_code === row.parameter_code,
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      if (newValue) {
                        onRowChange(
                          row.row_id,
                          "parameter_code",
                          newValue.parameter_code,
                        );
                        onRowChange(
                          row.row_id,
                          "parameter_name",
                          newValue.parameter_name || "",
                        );
                        onRowChange(row.row_id, "unit", newValue.unit || "");
                        onRowChange(
                          row.row_id,
                          "parameter_id",
                          newValue.id || "",
                        );
                      } else {
                        onRowChange(row.row_id, "parameter_code", "");
                        onRowChange(row.row_id, "parameter_name", "");
                        onRowChange(row.row_id, "unit", "");
                        onRowChange(row.row_id, "parameter_id", "");
                      }
                    }}
                    filterOptions={(options, { inputValue }) => {
                      const selected = configRows
                        .filter(
                          (r) => r.row_id !== row.row_id && r.parameter_code,
                        )
                        .map((r) => r.parameter_code);
                      return options.filter(
                        (o) =>
                          o.parameter_code
                            ?.toLowerCase()
                            .includes(inputValue.toLowerCase()) &&
                          !selected.includes(o.parameter_code),
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Chọn mã thông số"
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...rest } = props;
                      return (
                        <Box component="li" key={key} {...rest}>
                          <Typography variant="body2" fontWeight={600}>
                            {option.parameter_code}
                          </Typography>
                        </Box>
                      );
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { padding: "2px 8px" } }}
                  />
                </FieldRow>
                <Divider />

                {/* Tên thông số */}
                <FieldRow label="Tên thông số">
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={row.parameter_name || ""}
                  />
                </FieldRow>
                <Divider />

                {/* Giới hạn Min */}
                <FieldRow label="Giới hạn Min">
                  <TextField
                    size="small"
                    fullWidth
                    required
                    value={row.min_value}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, "");
                      const p = v.split(".");
                      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
                      onRowChange(row.row_id, "min_value", v);
                    }}
                  />
                </FieldRow>
                <Divider />

                {/* Giới hạn Max */}
                <FieldRow label="Giới hạn Max">
                  <TextField
                    size="small"
                    fullWidth
                    required
                    value={row.max_value}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, "");
                      const p = v.split(".");
                      if (p.length > 2) v = p[0] + "." + p.slice(1).join("");
                      onRowChange(row.row_id, "max_value", v);
                    }}
                  />
                </FieldRow>
                <Divider />

                {/* Đơn vị */}
                <FieldRow label="Đơn vị">
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={row.unit || ""}
                  />
                </FieldRow>
                <Divider />

                {/* Màu sắc */}
                <FieldRow label="Màu sắc">
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    position="relative"
                  >
                    {/* Color swatch */}
                    <Box
                      onClick={() => handleColorSwatchClick(row.row_id)}
                      sx={{
                        width: 28,
                        height: 28,
           
                        bgcolor: row.color || "#000000",
                        border: "2px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {row.color || "#000000"}
                    </Typography>

                    {/* Color Picker popover */}
                    {displayColorPicker[row.row_id] && (
                      <>
                        {/* Backdrop — phủ toàn màn hình, đóng picker khi click ngoài */}
                        <Box
                          sx={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 9998,
                          }}
                          onClick={() => handleColorClose(row.row_id)}
                        />
                        {/* Picker — nằm trên backdrop */}
                        <Box
                          sx={{
                            position: "fixed",
                            zIndex: 9999,
                            bottom: 80,
                            left: "50%",
                            transform: "translateX(-50%)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                         
                            overflow: "hidden",
                          }}
                        >
                          <SketchPicker
                            color={row.color || "#000000"}
                            onChange={(color) =>
                              onRowChange(
                                row.row_id,
                                "color",
                                color.hex
                                  ? `#${color.hex.replace(/^#/, "")}`
                                  : "#000000",
                              )
                            }
                            presetColors={[
                              "#D0021B",
                              "#F5A623",
                              "#F8E71C",
                              "#7ED321",
                              "#BD10E0",
                              "#9013FE",
                              "#4A90E2",
                              "#50E3C2",
                              "#B8E986",
                              "#000000",
                              "#4A4A4A",
                              "#9B9B9B",
                            ]}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                </FieldRow>
              </Box>
            )}
          </Box>
        );
      })}

      {/* ── Add button ── */}
      <Box display="flex" justifyContent="center" mt={1} mb={0.5}>
        <Fab
          size="medium"
          color="primary"
          onClick={onAddRow}
          sx={{ boxShadow: 3 }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
}

/* Helper: label + input side by side */
function FieldRow({ label, children }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 110, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box flex={1}>{children}</Box>
    </Stack>
  );
}
