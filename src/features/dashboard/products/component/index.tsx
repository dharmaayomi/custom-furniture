"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateComponent from "@/hooks/api/product/useCreateComponent";
import useDeleteComponent from "@/hooks/api/product/useDeleteComponent";
import useGetComponents from "@/hooks/api/product/useGetComponents";
import useUpdateComponent from "@/hooks/api/product/useUpdateComponent";
import { ComponentCategory, ProductComponent } from "@/types/product";
import {
  Filter,
  Grid3x3,
  Layers,
  List,
  PackageSearch,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";

type ComponentFormData = {
  componentName: string;
  componentUrl: string;
  componentDesc: string;
  componentCategory: ComponentCategory;
  price: string;
  weight: string;
  componentImageUrls: string;
  isActive: boolean;
};

const INITIAL_FORM_DATA: ComponentFormData = {
  componentName: "",
  componentUrl: "",
  componentDesc: "",
  componentCategory: "SHELF",
  price: "",
  weight: "",
  componentImageUrls: "",
  isActive: true,
};

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "SHELF",
  "DRAWER",
  "HANGER",
  "DOOR",
  "RAIL",
  "ACCESSORY",
  "HARDWARE",
];

const toFormData = (component: ProductComponent): ComponentFormData => ({
  componentName: component.componentName,
  componentUrl: component.componentUrl,
  componentDesc: component.componentDesc,
  componentCategory: component.componentCategory,
  price: String(component.price),
  weight: String(component.weight),
  componentImageUrls: (component.componentImageUrls ?? []).join("\n"),
  isActive: component.isActive,
});

const parseImageUrls = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const ComponentPreview = ({
  image,
  name,
  list,
}: {
  image?: string;
  name: string;
  list?: boolean;
}) => {
  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs"
    : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

  if (!image) return <div className={baseClass}>Preview</div>;

  return (
    <div className={baseClass}>
      <img src={image} alt={name} className="h-full w-full object-cover" />
    </div>
  );
};

export const ProductComponentPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [categoryFilter, setCategoryFilter] = useQueryState("category", {
    defaultValue: "ALL",
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "ALL",
  });
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy, setSortBy] = useQueryState("sortBy", {
    defaultValue: "componentName",
  });
  const [orderBy, setOrderBy] = useQueryState("orderBy", {
    defaultValue: "asc",
  });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const perPage = 6;
  const [debouncedSearch] = useDebounceValue(search, 500);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [createForm, setCreateForm] =
    useState<ComponentFormData>(INITIAL_FORM_DATA);
  const [editForm, setEditForm] =
    useState<ComponentFormData>(INITIAL_FORM_DATA);
  const [selectedComponent, setSelectedComponent] =
    useState<ProductComponent | null>(null);

  const resolvedCategory =
    categoryFilter === "ALL"
      ? undefined
      : (categoryFilter as ComponentCategory);
  const resolvedIsActive =
    statusFilter === "ACTIVE"
      ? true
      : statusFilter === "INACTIVE"
        ? false
        : undefined;
  const resolvedSortBy =
    sortBy === "price" ||
    sortBy === "componentCategory" ||
    sortBy === "createdAt" ||
    sortBy === "updatedAt"
      ? sortBy
      : "componentName";
  const resolvedOrderBy = orderBy === "desc" ? "desc" : "asc";

  const { data, isLoading, isError } = useGetComponents(
    {
      page,
      perPage,
      sortBy: resolvedSortBy,
      orderBy: resolvedOrderBy,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      isActive: resolvedIsActive,
      category: resolvedCategory,
      search: debouncedSearch || undefined,
    },
    true,
  );

  const components = data?.data ?? [];
  const meta = data?.meta;
  const { mutateAsync: createComponent, isPending: isCreating } =
    useCreateComponent();
  const { mutateAsync: updateComponent, isPending: isUpdating } =
    useUpdateComponent();
  const { mutateAsync: deleteComponent, isPending: isDeleting } =
    useDeleteComponent();

  const totalItems = meta?.total ?? components.length;

  const handleResetFilters = () => {
    void setSearch("");
    void setCategoryFilter("ALL");
    void setStatusFilter("ALL");
    void setMinPrice(null);
    void setMaxPrice(null);
    void setSortBy("componentName");
    void setOrderBy("asc");
    void setPage(1);
  };

  const openEditDialog = (component: ProductComponent) => {
    setSelectedComponent(component);
    setEditForm(toFormData(component));
    setIsEditOpen(true);
  };

  const openDeleteDialog = (component: ProductComponent) => {
    setSelectedComponent(component);
    setIsDeleteOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm(INITIAL_FORM_DATA);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createComponent({
        componentName: createForm.componentName,
        componentUrl: createForm.componentUrl,
        componentDesc: createForm.componentDesc,
        componentCategory: createForm.componentCategory,
        price: createForm.price,
        weight: createForm.weight,
        componentImageUrls: parseImageUrls(createForm.componentImageUrls),
      });

      toast.success("Component created successfully.");
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to create component.";
      toast.error(message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponent) return;
    try {
      await updateComponent({
        componentId: selectedComponent.id,
        payload: {
          componentName: editForm.componentName,
          componentUrl: editForm.componentUrl,
          componentDesc: editForm.componentDesc,
          componentCategory: editForm.componentCategory,
          price: editForm.price,
          weight: editForm.weight,
          componentImageUrls: parseImageUrls(editForm.componentImageUrls),
          isActive: editForm.isActive,
        },
      });

      toast.success("Component updated successfully.");
      setIsEditOpen(false);
      setSelectedComponent(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to update component.";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!selectedComponent) return;
    try {
      await deleteComponent(selectedComponent.id);
      toast.success("Component deleted successfully.");
      setIsDeleteOpen(false);
      setSelectedComponent(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to delete component.";
      toast.error(message);
    }
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Components
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage customization components.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <aside className="bg-card border-border h-fit rounded-lg border p-4 lg:sticky lg:top-4 lg:col-start-2">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <h2 className="text-sm font-semibold">Filters</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="component-search">Search</Label>
                  <Input
                    id="component-search"
                    placeholder="Name or category"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      void setPage(1);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-category">Category</Label>
                  <select
                    id="component-category"
                    value={categoryFilter}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setCategoryFilter(
                        event.target.value as "ALL" | ComponentCategory,
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    {COMPONENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-status">Status</Label>
                  <select
                    id="component-status"
                    value={statusFilter}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Price range</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="component-min-price">Min price</Label>
                    <Input
                      id="component-min-price"
                      type="number"
                      min={0}
                      value={minPrice ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        void setMinPrice(value ? Number(value) : null);
                        void setPage(1);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="component-max-price">Max price</Label>
                    <Input
                      id="component-max-price"
                      type="number"
                      min={0}
                      value={maxPrice ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        void setMaxPrice(value ? Number(value) : null);
                        void setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-sort-by">Sort by</Label>
                  <select
                    id="component-sort-by"
                    value={sortBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setSortBy(
                        event.target.value as "componentName" | "price",
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="componentName">Component Name</option>
                    <option value="componentCategory">Category</option>
                    <option value="price">Price</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-sort-order">Sort order</Label>
                  <select
                    id="component-sort-order"
                    value={orderBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setOrderBy(event.target.value as "asc" | "desc");
                      void setPage(1);
                    }}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </aside>

            <div className="lg:col-start-1 lg:row-start-1">
              <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  {totalItems} items
                </p>
                <div className="border-border bg-muted flex w-full gap-2 rounded-lg border p-1 sm:w-auto">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="flex-1 gap-2 sm:flex-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="flex-1 gap-2 sm:flex-none"
                  >
                    <List className="h-4 w-4" />
                    List
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-card overflow-hidden rounded-lg border shadow-sm"
                    >
                      <div className="bg-muted aspect-4/3 w-full animate-pulse" />
                      <div className="space-y-2 p-3">
                        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="border-border bg-card flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
                  <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    Failed to load components
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Please try again later.
                  </p>
                </div>
              ) : components.length === 0 ? (
                <div className="border-border bg-card flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
                  <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    No components found
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Create your first component to get started.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {components.map((item) =>
                    viewMode === "grid" ? (
                      <div
                        key={item.id}
                        className="bg-card overflow-hidden rounded-lg border shadow-sm"
                      >
                        <ComponentPreview
                          image={item.componentImageUrls?.[0]}
                          name={item.componentName}
                        />
                        <div className="p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <Layers className="text-muted-foreground h-4 w-4" />
                            <p className="text-foreground truncate text-sm font-semibold">
                              {item.componentName}
                            </p>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Category: {item.componentCategory}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Price: {item.price}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Weight: {item.weight} kg
                          </p>
                          <div className="mt-2">
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="border-border mt-3 flex gap-2 border-t pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                              className="flex-1 bg-transparent"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(item)}
                              className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        className="bg-card rounded-lg border p-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <ComponentPreview
                            list
                            image={item.componentImageUrls?.[0]}
                            name={item.componentName}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Layers className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground truncate text-sm font-semibold">
                                {item.componentName}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Category: {item.componentCategory}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Price: {item.price}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Weight: {item.weight} kg
                            </p>
                            <div className="mt-2">
                              <Badge
                                variant={
                                  item.isActive ? "default" : "secondary"
                                }
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                              className="flex-1 bg-transparent sm:flex-none"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(item)}
                              className="text-destructive hover:bg-destructive bg-transparent hover:text-white sm:flex-none"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {!isLoading && !isError && totalItems > 0 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    Page {meta?.page ?? page} of{" "}
                    {meta
                      ? Math.max(1, Math.ceil(meta.total / meta.perPage))
                      : 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void setPage(Math.max(1, (meta?.page ?? page) - 1))
                      }
                      disabled={!meta?.hasPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void setPage((meta?.page ?? page) + 1)}
                      disabled={!meta?.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Component</DialogTitle>
              <DialogDescription>
                Add a new component to the customization catalog.
              </DialogDescription>
            </DialogHeader>

            <ComponentFormFields
              formData={createForm}
              setFormData={setCreateForm}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Component"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
              <DialogDescription>
                Update component data and image references.
              </DialogDescription>
            </DialogHeader>

            <ComponentFormFields
              formData={editForm}
              setFormData={setEditForm}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedComponent(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete component?</DialogTitle>
            <DialogDescription>
              {selectedComponent ? (
                <>
                  You are about to delete{" "}
                  <span className="text-foreground font-semibold">
                    {selectedComponent.componentName}
                  </span>
                  . This action cannot be undone.
                </>
              ) : (
                "Confirm delete."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Component"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

const ComponentFormFields = ({
  formData,
  setFormData,
}: {
  formData: ComponentFormData;
  setFormData: Dispatch<SetStateAction<ComponentFormData>>;
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid gap-4 py-1">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="componentName">Component Name *</Label>
          <Input
            id="componentName"
            name="componentName"
            value={formData.componentName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="componentUrl">Component URL *</Label>
          <Input
            id="componentUrl"
            name="componentUrl"
            value={formData.componentUrl}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="componentDesc">Description *</Label>
        <textarea
          id="componentDesc"
          name="componentDesc"
          value={formData.componentDesc}
          onChange={handleInputChange}
          className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="componentCategory">Category *</Label>
          <select
            id="componentCategory"
            value={formData.componentCategory}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                componentCategory: e.target.value as ComponentCategory,
              }))
            }
            className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            {COMPONENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight *</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min="0"
            step="0.01"
            value={formData.weight}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="componentImageUrls">Image URLs (one per line) *</Label>
        <textarea
          id="componentImageUrls"
          name="componentImageUrls"
          value={formData.componentImageUrls}
          onChange={handleInputChange}
          className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          required
        />
      </div>
    </div>
  );
};
