# Everything sveet needs on your machine: `brew bundle` (in this folder), or
#   curl -fsSL https://raw.githubusercontent.com/nerdwerk/sveet/main/Brewfile | brew bundle --file=-
# The rest (dependencies, browsers, agents) lives inside the sandbox VM.
tap "superradcompany/tap"

brew "bun"                             # `bun create` and the project scripts
brew "superradcompany/tap/microsandbox" # the dev VM (Apple Silicon, or Linux with KVM)
brew "flyctl"                           # deploys — always from the host, never the sandbox
