interface GitHubConfig {
  owner: string
  repo: string
  token: string
}

interface CommitData {
  message: string
  content: string
  path: string
  branch?: string
}

interface GitHubResponse {
  sha?: string
  object?: { sha: string }
  [key: string]: unknown
}

export class GitHubIntegration {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  async createCommit(data: CommitData): Promise<GitHubResponse> {
    const { message, content, path, branch = 'main' } = data
    const { owner, repo, token } = this.config

    try {
      // Get the current commit SHA
      const branchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!branchResponse.ok) {
        throw new Error(`Failed to get branch info: ${branchResponse.statusText}`)
      }

      const branchData = await branchResponse.json()
      const currentSha = branchData.object.sha

      // Get the current tree
      const commitResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentSha}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!commitResponse.ok) {
        throw new Error(`Failed to get commit info: ${commitResponse.statusText}`)
      }

      const commitData = await commitResponse.json()
      const treeSha = commitData.tree.sha

      // Create a new blob
      const blobResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: Buffer.from(content).toString('base64'),
            encoding: 'base64',
          }),
        }
      )

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob: ${blobResponse.statusText}`)
      }

      const blobData = await blobResponse.json()

      // Create a new tree
      const newTreeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_tree: treeSha,
            tree: [
              {
                path: path,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha,
              },
            ],
          }),
        }
      )

      if (!newTreeResponse.ok) {
        throw new Error(`Failed to create tree: ${newTreeResponse.statusText}`)
      }

      const newTreeData = await newTreeResponse.json()

      // Create a new commit
      const newCommitResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            tree: newTreeData.sha,
            parents: [currentSha],
          }),
        }
      )

      if (!newCommitResponse.ok) {
        throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`)
      }

      const newCommitData = await newCommitResponse.json()

      // Update the branch reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sha: newCommitData.sha,
          }),
        }
      )

      if (!updateRefResponse.ok) {
        throw new Error(`Failed to update reference: ${updateRefResponse.statusText}`)
      }

      return await updateRefResponse.json()
    } catch (error) {
      console.error('GitHub commit failed:', error)
      throw error
    }
  }

  async createPullRequest(data: {
    title: string
    body: string
    head: string
    base: string
  }): Promise<GitHubResponse> {
    const { owner, repo, token } = this.config

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to create pull request: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('GitHub pull request failed:', error)
      throw error
    }
  }
}