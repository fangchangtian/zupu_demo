// Claude Code WorktreeRemove hook
// Reads hook JSON from stdin, removes a git worktree
const { execSync } = require('child_process');
const path = require('path');

let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  const cwd = input.cwd;
  const name = input.name;
  const worktreeDir = path.join(cwd, '.claude', 'worktrees', name);
  const branch = 'claude-' + name;

  try {
    // Remove worktree directory
    execSync(`git worktree remove "${worktreeDir}" --force`, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    // worktree might not exist — ok
  }

  try {
    // Delete the branch
    execSync(`git branch -D "${branch}"`, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    // branch might not exist — ok
  }

  console.log('Removed worktree:', worktreeDir);
});
