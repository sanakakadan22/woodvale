curl https://raw.githubusercontent.com/shaynak/taylor-swift-lyrics/main/lyrics.json \
| sed 's# (Taylor\\u2019s Version)##g' \
| sed "s# (Taylor's Version)##g" \
| sed 's# \[From The Vault\]##g' \
| sed 's# \[From the Vault\]##g' \
| sed 's# (From The Vault)##g' \
| sed '/\"prev\":/d' \
| sed '/\"next\":/d' \
| sed '/\"multiplicity\":/d' \
| sed 's#",#"#' \
> src/server/lyrics/lyrics.json
