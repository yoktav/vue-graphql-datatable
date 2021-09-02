<template>
  <div>
    <div class="u-display-flex u-align-items-center u-flex-wrap-wrap">
      <div v-if="title.length > 0" class="u-margin-right-auto">
        <h3 class="h1 u-margin-bottom-large">{{ title }}</h3>
      </div>

      <div v-if="hasFilter">
        <Button
          theme="primary-submit"
          class="u-margin-bottom-large"
          tag="button"
          type="button"
          @click.native="filterModal = true"
        >
          Filtrele
        </Button>

        <Modal v-model="filterModal">
          <template #header>Filtrele </template>

          <template #content>
            <ValidationObserver ref="searchForm" tag="div">
              <form @submit.prevent>
                <div class="row">
                  <!-- Sütunlar-->
                  <div class="col col--lg-6">
                    <ValidationProvider
                      v-slot="{ errors }"
                      name="Sütunlar"
                      class="u-margin-bottom-large"
                      tag="div"
                    >
                      <label for="">
                        Sütunlar
                        <v-select
                          v-model="form.searchTypesCurrent"
                          :class="errors.length > 0 ? 'is-invalid' : null"
                          :options="form.searchTypes"
                          placeholder="Seçiniz"
                          multiple
                        >
                          <div slot="no-options">Herhangi bir sonuç bulunamadı.</div>
                        </v-select>
                      </label>
                      <div class="u-color-danger">{{ errors[0] }}</div>
                    </ValidationProvider>
                  </div>

                  <!-- Anahtar Kelime -->
                  <div class="col col--lg-6">
                    <ValidationProvider
                      v-slot="{ errors }"
                      name="Anahtar Kelime"
                      class="u-margin-bottom-large"
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
                </div>
              </form>
            </ValidationObserver>
          </template>

          <template #footer>
            <Button
              theme="primary"
              class="u-margin-top"
              tag="button"
              type="submit"
              @click.native="searchFormValidation"
            >
              Ara
            </Button>
          </template>
        </Modal>
      </div>
    </div>

    <div class="c-datatable">
      <table class="c-datatable__table">
        <thead>
          <tr>
            <th
              v-for="(column, i) in columns"
              :key="`${column.key}${i}`"
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
          <tr v-for="(row, a) in rows" :key="randomKey(row[a])">
            <td v-for="(cell, i) in row" :key="i" class="c-datatable__cell">
              <slot :name="`cell(${cell.slotId})`" :data="cell">
                {{ cell.data }}
              </slot>
            </td>
          </tr>

          <tr v-if="rows.length < 1">
            <td :colspan="columns.length">
              <p class="u-text-align-center u-padding-ends-small">Herhangi bir veri bulunamadı.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="rows.length > 0" class="row u-font-size-small u-margin-top-xsmall">
      <div class="col col--md-4 u-flexbox-vertical-center">
        {{ statistics.total }} sonuç arasından {{ statistics.from }} aralığı ile
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
import { randomKey } from '~/utils/randomKey';

export default {
  props: {
    columns: {
      type: Array,
      default: () => [],
    },

    hasFilter: {
      type: Boolean,
      default: true,
    },

    queryName: {
      type: Object,
      default: () => {},
    },

    title: {
      type: String,
      default: '',
    },

    id: {
      type: Number,
      default: null,
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
        totalPageCount: 1,
        visiblePageCount: 1,
      },

      rows: [],
      cells: [],

      rowCountSelectCurrent: 10,
      rowCountSelectOptions: [10, 20, 50, 100],

      statistics: {
        total: 0,
        from: 0,
        to: 0,
      },

      form: {
        searchTypesCurrent: [],
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

      filterModal: false,
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
    this.form.searchTypes = this.columns
      .filter(col => {
        return col.searchable;
      })
      .map(({ title: label, ...rest }) => ({
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
    randomKey,

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
            searchColumn: this.form.searchTypesCurrent.key
              ? this.form.searchTypesCurrent.key
              : null,
            orderColumn: this.form.searchTypesCurrent.key ? this.form.searchTypesCurrent.key : null,
            orderDirection: this.ORDER_DIRECTIONS.ASC,
            page: 1,
            limit: 10,
          });

          this.filterModal = false;
        }
      });
    },

    async getTableData(params) {
      const { searchText, searchColumn, orderColumn, orderDirection, page, limit } = params;

      try {
        let response;

        if (this.id) {
          response = await this.$apollo.query({
            query: this.queryName,
            variables: {
              searchText,
              searchColumn,
              orderColumn,
              orderDirection,
              page,
              limit: parseInt(limit, 10),
              id: this.id,
            },
          });
        } else {
          response = await this.$apollo.query({
            query: this.queryName,
            variables: {
              searchText,
              searchColumn,
              orderColumn,
              orderDirection,
              page,
              limit: parseInt(limit, 10),
            },
          });
        }

        this.cells = [];
        this.rows = [];

        let cellsTemp = [];

        const data = response.data[Object.keys(response.data)[0]];

        data.data.forEach(currentItem => {
          cellsTemp = [];

          this.columns.forEach(col => {
            const stripKey = col.key.split('.');
            const slotId = col.slotId.replace('.', '');

            console.log(slotId);

            if (stripKey.length < 2) {
              // This if statement is for to support cells that don't have backend column
              if (currentItem[stripKey[0]] == undefined) {
                cellsTemp.push({ key: col.key, slotId, data: {} });
              } else {
                cellsTemp.push({
                  key: col.key,
                  slotId,
                  data: currentItem[stripKey[0]],
                });
              }
            } else if (stripKey.length === 2) {
              cellsTemp.push({
                key: col.key,
                slotId,
                data: currentItem[stripKey[0]][stripKey[1]],
              });
            } else if (stripKey.length === 3) {
              cellsTemp.push({
                key: col.key,
                slotId,
                data: currentItem[stripKey[0]][stripKey[1]][stripKey[2]],
              });
            } else if (stripKey.length === 4) {
              cellsTemp.push({
                key: col.key,
                slotId,
                data: currentItem[stripKey[0]][stripKey[1]][stripKey[2]][stripKey[3]],
              });
            }
          });

          this.rows.push(cellsTemp);
        });

        this.statistics.total = data.total;
        this.statistics.from = data.from;
        this.statistics.to = data.to;

        // Since pagination components handles page change we should not set
        this.pagination.currentPage = data.current_page;
        this.pagination.totalPageCount = data.last_page;

        this.currentParams.searchText = searchText;
        this.currentParams.searchColumn = searchColumn;
        this.currentParams.orderColumn = orderColumn;
        this.currentParams.orderDirection = orderDirection;
        this.currentParams.page = page;
        this.currentParams.limit = limit;
      } catch (error) {
        if (this.checkApiRequestErrors({ that: this, error })) return;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import './Datatable';
</style>

<style lang="scss">
@import '~assets/styles/abstracts/index';

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
