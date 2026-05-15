import pathlib

OPEN_OLD = "<" + "motion"
OPEN_NEW = "<" + "div"
CLOSE_OLD = "</" + "motion>"
CLOSE_NEW = "</" + "div>"

root = pathlib.Path(__file__).resolve().parents[1] / "src"
for path in root.rglob("*.tsx"):
    text = path.read_text(encoding="utf-8")
    fixed = text.replace(OPEN_OLD, OPEN_NEW).replace(CLOSE_OLD, CLOSE_NEW)
    if fixed != text:
        path.write_text(fixed, encoding="utf-8")
        print(path)
