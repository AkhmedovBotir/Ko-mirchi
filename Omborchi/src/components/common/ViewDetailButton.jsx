import { Visibility } from '@mui/icons-material';

const ViewDetailButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Batafsil ko'rish"
    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
  >
    <Visibility sx={{ fontSize: 18 }} />
  </button>
);

export default ViewDetailButton;
