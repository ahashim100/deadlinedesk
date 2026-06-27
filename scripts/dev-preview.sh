#!/bin/zsh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="/Users/alihassanhashim/.nvm/versions/node/v24.18.0/bin:$PATH"
cd /Users/alihassanhashim/Downloads/Landlord
exec npm run dev
