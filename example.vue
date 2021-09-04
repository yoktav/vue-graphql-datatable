<template>
  <div>
    <Datatable :has-filter="true" title="User Group Table" :columns="columns" :query-name="TABLE_USER_GROUPS">
      <template #cell(username)="data">User name is {{ data.data.data }} </template>
      <template #cell(slug)="data">Group slug is {{ data.data.data }} </template>
    </Datatable>
  </div>
</template>

<script>
import { TABLE_USER_GROUPS } from './graphql/queries/tables';

export default {
  data() {
    return {
      TABLE_USER_GROUPS,

        columns: [
        {
          key: 'id',
          slotId: 'id',
          title: 'ID',
          searchable: true,
          sortable: true,
        },
        {
          key: 'group.slug',
          slotId: 'slug',
          title: 'Group',
          searchable: true,
          sortable: true,
        },
        {
          key: 'user.name',
          slotId: 'user.name',
          title: 'User Detail',
          searchable: true,
          sortable: false,
        },
      ],
    };
  },
};
</script>
