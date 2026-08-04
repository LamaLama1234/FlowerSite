"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCategories } from "@/hooks/useCategories";
import { categoryService } from "@/services/category.service";
import type {
  ICategory,
  ICategoryInput,
} from "@/shared/types/category.interface";
import { extractErrorMessage } from "@/utils/errors";

const EMPTY_FORM: ICategoryInput = { title: "", description: "" };

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ICategoryInput>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  const createMutation = useMutation({
    mutationFn: (dto: ICategoryInput) => categoryService.create(dto),
    onSuccess() {
      toast.success("Категория создана");
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; dto: ICategoryInput }) =>
      categoryService.update(vars.id, vars.dto),
    onSuccess() {
      toast.success("Категория обновлена");
      setEditingId(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess() {
      toast.success("Категория удалена");
      setDeleteTarget(null);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  function startEdit(category: ICategory) {
    setEditingId(category.id);
    setForm({ title: category.title, description: category.description });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-gold-200/50 text-muted-foreground border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Описание</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="text-muted-foreground px-4 py-6" colSpan={3}>
                  Загрузка…
                </td>
              </tr>
            ) : !categories?.length ? (
              <tr>
                <td className="text-muted-foreground px-4 py-6" colSpan={3}>
                  Категорий пока нет
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-gold-100/60 border-b last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{category.title}</td>
                  <td className="text-muted-foreground max-w-xs truncate px-4 py-3">
                    {category.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEdit(category)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="hover:text-destructive"
                        aria-label={`Удалить категорию «${category.title}»`}
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel flex h-fit flex-col gap-3 rounded-2xl p-5"
      >
        <h2 className="text-primary flex items-center justify-between text-lg font-semibold">
          {editingId ? "Редактировать категорию" : "Новая категория"}
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </h2>
        <input
          type="text"
          required
          maxLength={100}
          placeholder="Название"
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          className={inputClass}
        />
        <textarea
          required
          maxLength={2000}
          rows={3}
          placeholder="Описание"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className={inputClass}
        />
        <Button type="submit" disabled={isPending}>
          <Plus className="size-4" />
          {editingId ? "Сохранить" : "Создать"}
        </Button>
      </form>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Категория «{deleteTarget?.title}» будет удалена без возможности
              восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gold-200/50 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";
