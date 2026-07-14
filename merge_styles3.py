import re

with open('src/components/AttendeesAdmin.tsx', 'r') as f:
    content = f.read()

# Merge style across newlines
content = re.sub(r'\}\}\s+style=\{\{', ', ', content)

with open('src/components/AttendeesAdmin.tsx', 'w') as f:
    f.write(content)

