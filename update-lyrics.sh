curl https://raw.githubusercontent.com/sanakakadan22/taylor-swift-lyrics-searcher/main/lyrics.json \
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
