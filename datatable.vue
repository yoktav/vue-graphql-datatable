<template>
  <div>
    <div v-if="hasSearch">
      <ValidationObserver ref="searchForm" tag="div">
        <form class="row" @submit.prevent>
          <!-- Arama Tipi -->
          <div class="col col--md-5 col--lg-3">
            <ValidationProvider
              v-slot="{ errors }"
              name="Arama Tipi"
              rules="required"
              class="u-margin-bottom"
              tag="div"
            >
              <label for="">
                Arama Tipi
                <v-select
                  v-model="form.searchTypesCurrent"
                  :class="errors.length > 0 ? 'is-invalid' : null"
                  :options="form.searchTypes"
                  placeholder="Seçiniz"
                >
                  <div slot="no-options">Herhangi bir sonuç bulunamadı.</div>
                </v-select>
              </label>
              <div class="u-color-danger">{{ errors[0] }}</div>
            </ValidationProvider>
          </div>

          <div class="col col--md-5">
            <!-- Anahter Kelime -->
            <ValidationProvider
              v-slot="{ errors }"
              name="Anahter Kelime"
              rules="required"
              class="u-margin-bottom"
              tag="div"
            >
              <label for="">
                Anahtar Kelime
                <Input
                  v-model="form.searchTerm"
                  :is-invalid="errors.length > 0"
                  tag="input"
                  input-element="input"
                  input-type="text"
                  placeholder="Yazınız"
                />
              </label>
              <div class="u-color-danger">{{ errors[0] }}</div>
            </ValidationProvider>
          </div>

          <div class="col col--md-5 col--lg-4 u-margin-bottom">
            <Button
              theme="primary-submit"
              class="u-margin-top"
              tag="button"
              type="submit"
              @click.native="searchFormValidation"
            >
              Ara
            </Button>
          </div>
        </form>
      </ValidationObserver>
    </div>

    <table class="c-datatable">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            ref="tableHead"
            :data-column-key="column.key"
            :tabindex="column.sortable ? '0' : false"
            :class="['c-datatable__head', column.sortable ? CLASSES.IS_SORTABLE : null]"
            v-on="column.sortable ? { click: $event => handleSortable($event.target) } : {}"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, a) in rows" :key="row.id">
          <td v-for="(cell, i) in cells[a]" :key="i" class="c-datatable__cell">
            <slot :name="`cell(${[columns[i].key]})`" :data="cell">
              {{ cell }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="row u-font-size-small u-margin-top-xsmall">
      <div class="col col--md-4 u-flexbox-vertical-center">
        {{ statistics.total }} sonuç arasından {{ statistics.from }} aralığı
        {{ statistics.to }} gösteriliyor
      </div>

      <div class="col col--md-8 u-display-flex">
        <div class="u-display-flex u-align-items-center u-margin-left-auto">
          Sayfa başı

          <v-select
            v-model="rowCountSelectCurrent"
            :options="rowCountSelectOptions"
            placeholder="Seçiniz"
            class="datatable-row-select"
          >
            <div slot="no-options">Herhangi bir sonuç bulunamadı.</div>
          </v-select>
          satır
        </div>

        <div class="u-margin-left-small">
          <Pagination
            :total-page-count="pagination.totalPageCount"
            :max-visible-page-count="pagination.visiblePageCount"
            :current-page="pagination.currentPage"
            @page-changed="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { TABLE_NAMES, TABLE_USER_GROUPS } from '~/graphql/queries/tables';

export default {
  props: {
    columns: {
      type: Array,
      default: () => [],
    },

    hasSearch: {
      type: Boolean,
      default: true,
    },

    queryName: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      NODE_DATASETS: {
        ORDER_DIRECTION: 'data-order-direction',
        COLUMN_KEY: 'data-column-key',
      },

      ORDER_DIRECTIONS: {
        // Should be UPPER CASE due to predefined graphql types
        ASC: 'ASC',
        DESC: 'DESC',
      },

      CLASSES: {
        IS_SORTABLE: 'is-sortable',
        IS_ASCENDING: 'is-ascending',
        IS_DESCENDING: 'is-descending',
      },

      pagination: {
        currentPage: 1,
        totalPageCount: 100,
        visiblePageCount: 5,
      },

      rows: [],
      cells: [],

      rowCountSelectCurrent: 10,
      rowCountSelectOptions: [10, 20, 50, 100],

      statistics: {
        total: null,
        from: null,
        to: null,
      },

      form: {
        searchTypesCurrent: null,
        searchTypes: [],

        searchTerm: null,
      },

      currentParams: {
        searchText: '',
        searchColumn: '',
        orderColumn: '',
        orderDirection: '',
        page: '',
        limit: '',
      },
    };
  },

  watch: {
    rowCountSelectCurrent() {
      this.getTableData({
        searchText: this.currentParams.searchText,
        searchColumn: this.currentParams.searchColumn,
        orderColumn: this.currentParams.orderColumn,
        orderDirection: this.currentParams.orderDirection,
        page: this.currentParams.pageNumber,
        limit: this.rowCountSelectCurrent,
      });
    },
  },

  mounted() {
    // Replace title key to label
    this.form.searchTypes = this.columns.map(({ title: label, ...rest }) => ({
      label,
      ...rest,
    }));

    this.getTableData({
      searchText: '',
      searchColumn: '',
      orderColumn: this.form.searchTypes[0].key,
      orderDirection: this.ORDER_DIRECTIONS.ASC,
      page: 1,
      limit: 10,
    });
  },

  methods: {
    handlePageChange(pageNumber) {
      this.getTableData({
        searchText: this.currentParams.searchText,
        searchColumn: this.currentParams.searchColumn,
        orderColumn: this.currentParams.orderColumn,
        orderDirection: this.currentParams.orderDirection,
        page: pageNumber,
        limit: this.currentParams.limit,
      });
    },

    handleSortableClasses(currentElement) {
      const hasAscendingClass = currentElement.classList.contains(this.CLASSES.IS_ASCENDING);
      const hasDescendingClass = currentElement.classList.contains(this.CLASSES.IS_DESCENDING);

      this.$refs.tableHead.forEach(currentItem => {
        currentItem.removeAttribute(this.NODE_DATASETS.ORDER_DIRECTION);
        currentItem.classList.remove(this.CLASSES.IS_ASCENDING);
        currentItem.classList.remove(this.CLASSES.IS_DESCENDING);
      });

      if (hasAscendingClass) {
        currentElement.classList.remove(this.CLASSES.IS_ASCENDING);
        currentElement.classList.add(this.CLASSES.IS_DESCENDING);
        currentElement.setAttribute(this.NODE_DATASETS.ORDER_DIRECTION, this.ORDER_DIRECTIONS.DESC);
      } else if (hasDescendingClass) {
        currentElement.removeAttribute(this.NODE_DATASETS.ORDER_DIRECTION);
        currentElement.classList.remove(this.CLASSES.IS_ASCENDING);
        currentElement.classList.remove(this.CLASSES.IS_DESCENDING);
      } else {
        currentElement.classList.add(this.CLASSES.IS_ASCENDING);
        currentElement.setAttribute(this.NODE_DATASETS.ORDER_DIRECTION, this.ORDER_DIRECTIONS.ASC);
      }
    },

    handleSortable(currentElement) {
      this.handleSortableClasses(currentElement);

      this.getTableData({
        searchText: '',
        searchColumn: '',
        orderColumn: currentElement.getAttribute(this.NODE_DATASETS.COLUMN_KEY),
        orderDirection: currentElement.getAttribute(this.NODE_DATASETS.ORDER_DIRECTION),
        page: 1,
        limit: 10,
      });
    },

    searchFormValidation() {
      this.$refs.searchForm.validate().then(success => {
        if (success) {
          this.getTableData({
            searchText: this.form.searchTerm,
            searchColumn: this.form.searchTypesCurrent.key,
            orderColumn: this.form.searchTypesCurrent.key,
            orderDirection: this.ORDER_DIRECTIONS.ASC,
            page: 1,
            limit: 10,
          });
        }
      });
    },

    async getTableData(params) {
      const { searchText, searchColumn, orderColumn, orderDirection, page, limit } = params;

      try {
        const response = await this.$apollo.query({
          query: this.queryName == TABLE_NAMES.USER_GROUPS ? TABLE_USER_GROUPS : null,
          variables: {
            searchText,
            searchColumn,
            orderColumn,
            orderDirection,
            page,
            limit: parseInt(limit, 10),
          },
        });

        // Since query names can not be dynamic, we should create a dynamic way.
        // Server response is an object with query name key.
        // That's why we are creating an array to access to data with index.
        const result = Object.keys(response.data).map(key => [key, response.data[key]]);

        this.statistics.total = result[0][1].total;
        this.statistics.from = result[0][1].from;
        this.statistics.to = result[0][1].to;

        // Since pagination components handles page change we should not set
        // this.pagination.currentPage = result[0][1].current_page;
        this.pagination.totalPageCount = parseInt(result[0][1].last_page, 10);

        this.cells = [];
        this.rows = result[0][1].data;

        Object.values(this.rows).forEach(currentItem => {
          const cellArray = Object.values(currentItem);

          cellArray.pop();

          this.cells.push(cellArray);
        });

        this.currentParams.searchText = searchText;
        this.currentParams.searchColumn = searchColumn;
        this.currentParams.orderColumn = orderColumn;
        this.currentParams.orderDirection = orderDirection;
        this.currentParams.page = page;
        this.currentParams.limit = limit;
      } catch (error) {
        if (process.env.NUXT_ENV_MODE === 'development') console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../assets/styles/abstracts/index';

.c-datatable {
  $triangle-size: px-to-rem(6px);
  $triangle-initial-color: color-palette('gray', 500);
  $triangle-active-color: color-palette('gray', 900);
  $triangle-gaps: px-to-rem(2px);

  $class-is-sortable: 'is-sortable';
  $class-is-ascending: 'is-ascending';
  $class-is-descending: 'is-descending';

  width: 100%;

  &__head {
    position: relative;
    padding: pad(2xsmall) pad(3xsmall);
    background-color: rgba($color-primary, 0.1);
    color: $g-text-color;
    line-height: 1;
    user-select: none;

    &.#{$class-is-sortable} {
      cursor: pointer;
    }

    &.#{$class-is-sortable}::before,
    &.#{$class-is-sortable}::after {
      position: absolute;
      right: px-to-rem(8px);
    }

    &.#{$class-is-sortable}::before {
      @include css-triangle($triangle-size, $triangle-initial-color, top);

      top: 50%;
      transform: translate3d(0, calc(-50% + #{$triangle-gaps / 2} + #{$triangle-size}), 0);
    }

    &.#{$class-is-sortable}::after {
      @include css-triangle($triangle-size, $triangle-initial-color, bottom);

      bottom: 50%;
      transform: translate3d(0, calc(-50% - #{$triangle-gaps / 2} + #{$triangle-size}), 0);
    }

    &.#{$class-is-descending}::before {
      border-top-color: $triangle-active-color;
    }

    &.#{$class-is-ascending}::after {
      border-bottom-color: $triangle-active-color;
    }
  }

  &__cell {
    padding: pad(4xsmall) pad(3xsmall);
  }

  tr {
    &:nth-of-type(even) {
      // stylelint-disable-next-line selector-max-specificity
      .c-datatable__cell {
        background-color: rgba($color-primary, 0.05);
      }
    }
    &:hover {
      // stylelint-disable-next-line selector-max-specificity
      .c-datatable__cell {
        background-color: rgba($color-primary, 0.07);
      }
    }
  }
}

</style>

<style lang="scss">
@import '../../assets/styles/abstracts/index';

.v-select.datatable-row-select {
  display: inline-block;
  width: px-to-rem(96px);
  margin-right: gap(4xsmall);
  margin-left: gap(4xsmall);

  .vs__selected,
  .vs__search {
    height: px-to-rem(16px);
  }
}
</style>
