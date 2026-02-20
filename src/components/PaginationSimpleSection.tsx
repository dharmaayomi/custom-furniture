"use client";

import { PaginationMeta } from "@/types/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

interface PaginationSimpleSectionProps extends PaginationMeta {
  onChangePage: (page: number) => void;
  maxVisiblePages?: number;
}

const PaginationSimpleSection = ({
  page,
  perPage,
  total,
  onChangePage,
  maxVisiblePages = 5,
}: PaginationSimpleSectionProps) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (totalPages <= 1) return null;

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const pages = Array.from({ length: end - start + 1 }, (_, index) => {
    return start + index;
  });

  return (
    <Pagination>
      <PaginationContent>
        {pages.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              isActive={page === pageNumber}
              onClick={(event) => {
                event.preventDefault();
                if (pageNumber !== page) {
                  onChangePage(pageNumber);
                }
              }}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationSimpleSection;
