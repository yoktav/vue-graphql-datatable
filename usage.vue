<template>
  <div>
    <Datatable :has-search="true" :columns="columns" :query-name="TABLE_NAMES.USER_GROUPS">
      <template #cell(content)="data">asd {{ data.data }} </template>
    </Datatable>
  </div>
</template>

<script>
import { TABLE_NAMES } from './graphql/queries/tables';

export default {
  data() {
    return {
      TABLE_NAMES,

        columns: [
        {
          key: 'id',
          title: 'ID',
          searchable: true,
          sortable: true,
        },
        {
          key: 'title',
          title: 'Başlık',
          searchable: true,
          sortable: true,
        },
        {
          key: 'content',
          title: 'İçerik',
          searchable: true,
          sortable: false,
        },
      ],
    };
  },
};
</script>
