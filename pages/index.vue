<template>
  <div>
    <div><Button @click="test">fetch</Button></div>
    <div>
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"
                ><FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup>
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";

const { getModels } = useApi();

const test = async () => {
  console.log("test");
  const res = await getModels();
  console.log(res);
  data.value = res.data;

  console.log("data", data.value);
};

const data = shallowRef([]);

const columns = [
  {
    id: "id",
    header: "id",
    accessorKey: "id",
  },
  {
    id: "name",
    header: "name",
    accessorKey: "name",
  },
  {
    id: "last_modified_time",
    header: "last_modified_time",
    accessorKey: "last_modified_time",
  },
  {
    id: "register_date",
    header: "register_date",
    accessorKey: "register_date",
  },
  {
    id: "type",
    header: "type",
    accessorKey: "type",
  },
  {
    id: "version",
    header: "version",
    accessorKey: "version",
  },
  {
    id: "description",
    header: "description",
    accessorKey: "description",
  },
];

const table = useVueTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});
</script>

<style></style>
