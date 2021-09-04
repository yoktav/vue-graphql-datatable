import gql from 'graphql-tag';

export const TABLE_USER_GROUPS = gql`
  query tableUserGroups(
    $searchText: String
    $searchColumn: String
    $orderColumn: String
    $orderDirection: orderEnum
    $page: Int
    $limit: Int
  ) {
    tableUserGroups(
      search: { text: $searchText, column: $searchColumn }
      orderBy: { column: $orderColumn, direction: $orderDirection }
      page: $page
      limit: $limit
    ) {
      to
      from
      total
      per_page
      last_page
      current_page
      has_more_pages
      data {
        id
        title
        content
      }
    }
  }
`;
