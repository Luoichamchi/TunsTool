"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";
import PageContainer from "@/app/components/container/PageContainer";
import { getFetcher, postFetcher, putFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

export default function DemoPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const canCreate = useHasPermission("demo", "create");
  const canUpdate = useHasPermission("demo", "update");
  const canDelete = useHasPermission("demo", "delete");

  const url = `${api.GET_DEMO_LIST}/?search=${search || ""}&page=${page}&page_size=10`;
  const { data, mutate, isLoading } = useSWR(url, getFetcher);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title || "", description: item.description || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await putFetcher(`${api.PUT_DEMO}/${editing.id}`, form);
        toast.success("Updated demo");
      } else {
        await postFetcher(api.POST_DEMO, form);
        toast.success("Created demo");
      }
      setDialogOpen(false);
      mutate();
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this demo item?")) return;
    try {
      await deleteFetcher(`${api.DELETE_DEMO}${id}`);
      toast.success("Deleted");
      mutate();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <PageContainer title="Demo CRUD" description="Sample CRUD page wired to backend /api/demos">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {canCreate && (
            <Button variant="contained" onClick={openCreate}>
              Add demo
            </Button>
          )}
        </Stack>

        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          (data?.data || []).map((item) => (
            <Box
              key={item.id}
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography fontWeight={700}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description || "—"}
                </Typography>
              </Box>
              <Stack direction="row">
                {canUpdate && (
                  <IconButton onClick={() => openEdit(item)} size="small">
                    <IconEdit size={18} />
                  </IconButton>
                )}
                {canDelete && (
                  <IconButton onClick={() => handleDelete(item.id)} size="small" color="error">
                    <IconTrash size={18} />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit demo" : "Create demo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
