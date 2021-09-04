# Example Response

JSON:

``` json
{
  "data": {
    "userGroups": {
      "from": 1,
      "to": 10,
      "total": 43,
      "current_page": 1,
      "last_page": 5,
      "per_page": 10,
      "has_more_pages": true,
      "data": [
        {
          "id": 1,
          "group": { "id": 1, "name": "Frontend", "slug": "development-frontend", "__typename": "Group" },
          "user": { "id": 1, "name": "Yilmaz Oktav", "__typename": "User" },
          "__typename": "userGroup"
        },
        {
          "id": 2,
          "group": { "id": 2, "name": "UX", "slug": "design-ux", "__typename": "Group" },
          "user": { "id": 2, "name": "John Doe", "__typename": "User" },
          "__typename": "userGroup"
        },
        {
          "id": 3,
          "group": { "id": 3, "name": "QA", "slug": "development-qa", "__typename": "Group" },
          "user": { "id": 3, "name": "Mary Doe", "__typename": "User" },
          "__typename": "userGroup"
        },
      ],
      "__typename": "UserGroupPagination"
    }
  },
  "loading": false,
  "networkStatus": 7,
  "stale": false
}

```