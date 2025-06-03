export default function (fieldNames) {
  return fieldNames.map(i => {
    switch (i) {
      case 'petrock':
        return 'petrock'
      default:
        return null
    }
  }).filter(i => i !== null)
}
