with open('src/components/AttendeesAdmin.tsx', 'r') as f:
    content = f.read()

# Merge adjacent style tags: }} style={{ -> , 
content = content.replace('}} style={{', ', ')

with open('src/components/AttendeesAdmin.tsx', 'w') as f:
    f.write(content)

