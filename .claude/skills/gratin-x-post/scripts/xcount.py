# usage: python3 xcount.py < post.txt   — X weighted length (CJK/emoji = 2, Latin = 1); limit 280.
import sys
t=sys.stdin.read().rstrip("\n")
w=0
for ch in t:
    o=ord(ch)
    w+=1 if (o<=4351 or 8192<=o<=8205 or 8208<=o<=8223 or 8242<=o<=8247) else 2
print(w,"/280")
