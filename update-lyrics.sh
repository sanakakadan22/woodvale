curl https://raw.githubusercontent.com/shaynak/taylor-swift-lyrics/main/lyrics.json \
| sed 's# (Taylor\\u2019s Version)##g' \
| sed 's# \[From The Vault\]##' \
| sed '/\"prev\":/d' \
| sed '/\"next\":/d' \
| sed '/\"multiplicity\":/d' \
| sed 's#",#"#' \
> src/server/lyrics/lyrics.json
