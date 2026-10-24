import sys
sys.path.insert(0, '.')
from trustx.challenges.base import registry

stats = registry.get_stats()
print('Total:', stats['total'], 'Red:', stats['red'], 'Blue:', stats['blue'])
for c in registry.list_all():
    print(c.get('name', '?'), ':', 'difficulty=', c.get('difficulty', '?'), ', team=', c.get('team', '?'))
print()
print('By team - Red:')
for c in registry.list_by_team('red'):
    print(' ', c.get('name', '?'), ':', c.get('difficulty', '?'))
print('By team - Blue:')
for c in registry.list_by_team('blue'):
    print(' ', c.get('name', '?'), ':', c.get('difficulty', '?'))
print()
print('By difficulty - Easy:')
for c in registry.list_by_difficulty('Easy'):
    print(' ', c.get('name', '?'))
print('By difficulty - Intermediate:')
for c in registry.list_by_difficulty('Intermediate'):
    print(' ', c.get('name', '?'))
print('By difficulty - Advanced:')
for c in registry.list_by_difficulty('Advanced'):
    print(' ', c.get('name', '?'))