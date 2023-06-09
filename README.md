# vercel-preview-url-alias

<p align="center">
  <a href="https://github.com/justincase-jp/vercel-preview-url-alias/actions"><img alt="typescript-action test status" src="https://github.com/justincase-jp/vercel-preview-url-alias/workflows/build-test/badge.svg"></a>
  <a href="https://github.com/justincase-jp/vercel-preview-url-alias/actions"><img alt="typescript-action event-test status" src="https://github.com/justincase-jp/vercel-preview-url-alias/workflows/event-test/badge.svg"></a>
</p>

Get your Vercel's preview URL and alias it to your own domain.

## Settings

1. Add following key-value to your repository's secrets.

   - `VERCEL_ACCESS_TOKEN`: https://vercel.com/docs/rest-api#introduction/api-basics/authentication/creating-an-access-token
   - `VERCEL_PROJECT_ID`: Get your Project ID from project settings in Vercel management console
   - `VERCEL_TEAM_ID`(Optional): Get your Team ID in Vercel management console. It's not necessary if the project is in your personal account

2. Decide your URL's alias template.

   eg: `{random}.vercel-preview-url-alias.joinsure.tech`

   - `{random}`: Random UUID generated by Github Action.

   **CAUTION**: You `HAVE TO` add your alias domain to Vercel first.

## Add Github Action

Add `e2e.yaml` to your repository's `.github/workflows` directory.

### Method 1 (**Recommended**)

Trigger the alias by Github Action's `deployment_status`.

```yaml
name: e2e
on: [deployment_status]

jobs:
  event_test:
    # change the environment value to your project's deployment name
    if: github.event.deployment_status.state == 'success' && github.event.deployment.environment == 'Preview'
    runs-on: ubuntu-latest
    steps:
      .
      . your own steps
      .

      - name: Get Vercel's Alias Preview URL
        id: alias-preview-url
        uses: justincase-jp/vercel-preview-url-alias@0.2.1
        with:
          vercel_access_token: ${{ secrets.VERCEL_ACCESS_TOKEN }}
          vercel_team_id: ${{ secrets.VERCEL_TEAM_ID }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias_template: '{random}.vercel-preview-url-alias.joinsure.tech'

      - name: Echo preview
        run: echo "${{ steps.alias-preview-url.outputs.preview_url_origin }} vs ${{ steps.alias-preview-url.outputs.preview_url_alias }}"
```

### Method 2

Trigger the alias by Github Action's `pull_request`.

**CAUTION**: The Github Action will run immediately and check the deployment status by calling Vercel's API every 10 seconds.(default)

```yaml
name: e2e
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      .
      . your own steps
      .

      - name: Get Vercel's Alias Preview URL
        id: alias-preview-url
        uses: justincase-jp/vercel-preview-url-alias@0.2.1
        with:
          vercel_access_token: ${{ secrets.VERCEL_ACCESS_TOKEN }}
          vercel_team_id: ${{ secrets.VERCEL_TEAM_ID }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias_template: '{random}.vercel-preview-url-alias.joinsure.tech'

      - name: Echo preview
        run: echo "${{ steps.alias-preview-url.outputs.preview_url_origin }} vs ${{ steps.alias-preview-url.outputs.preview_url_alias }}"
```

## Options

| `inputs`            | required |    default     | description                                                                                                        |
| :------------------ | :------: | :------------: | :----------------------------------------------------------------------------------------------------------------- |
| vercel_access_token |    ○     |                | https://vercel.com/docs/rest-api#introduction/api-basics/authentication/creating-an-access-token                   |
| vercel_project_id   |    ○     |                | Get your Project ID from project settings in Vercel management console.                                            |
| vercel_team_id      |    △     |                | Get your Team ID in Vercel management console.                                                                     |
| alias_template      |          |                | Your alias URL template. eg: (`hello.mysite.com`) or (`{random}.e2e-test.mysite.com`).                             |
| token               |          | `github.token` | Github Personal Access Token deployment                                                                            |
| interval            |          |  `10000 (ms)`  | waiting interval while deployment is not finished in milliseconds                                                  |
| fail_when_cancelled |          |     `true`     | Fail CI when deployment status is `CANCELED`                                                                       |
| commit_sha          |          |                | sha of commit which triggered Vercel Preview deployment. It is useful when workflow is triggered by issue_comment. |

| `outputs`            | description                                                                               |
| :------------------- | :---------------------------------------------------------------------------------------- |
| `preview_url_alias`  | Alias of Vercel's Deployment Preview URL. (Will be empty if alias_template is not passed) |
| `preview_url_origin` | Original Vercel's Deployment Preview URL                                                  |
| `status`             | `READY`, `ERROR`, `CANCELED`, `DEPLOYMENT_NOT_FOUND`                                      |

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
