"use client";

import { useFormStatus } from "react-dom";
import { removeProduct } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="chip danger" disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={removeProduct}
      onSubmit={(e) => {
        if (!confirm(`Delete “${name}”? This also removes its image.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
