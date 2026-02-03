export default function DataTable({ columns, data }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-pink-100 text-gray-600">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left font-medium px-4 py-2 border-b border-gray-300"
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="border-b border-gray-200 hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2 whitespace-nowrap">
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
