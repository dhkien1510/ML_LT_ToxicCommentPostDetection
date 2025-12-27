import { Link } from "react-router-dom";

export default function Back() {
    return (
        <>
            {/* Back Button */}
            <Link
                to="/"
                className="w-24 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
            >
                ← Back
            </Link>
        </>
    );
}
