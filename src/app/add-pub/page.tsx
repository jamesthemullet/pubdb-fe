"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddPubPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [website, setWebsite] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [operator, setOperator] = useState<string | undefined>(undefined);
  const [area, setArea] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [borough, setBorough] = useState<string | undefined>(undefined);
  const [openingHours, setOpeningHours] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [user, setUser] = useState<{
    email: string;
    approved?: boolean;
  } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({ email: payload.email, approved: payload.approved });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const body: any = {
        name,
        city,
        address,
        postcode,
        lat,
        lng,
        website,
        description,
        imageUrl,
        tags,
        operator,
        area,
        phone,
        borough,
        openingHours,
      };
      const res = await fetch(`${apiUrl}/pubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.errors || "Unknown error");
      } else {
        setSuccess("Pub added successfully!");
        setTimeout(() => {
          router.push(`/pubs/${data.name}`);
        }, 1000);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(
      e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    );
  };

  return (
    <div>
      <h2>Add a Pub</h2>
      {!user ? (
        <div>
          <p>You must be logged in to add a pub.</p>
          <a href="/register">Register or Login</a>
        </div>
      ) : !user.approved ? (
        <div>
          <p>Your account is not approved yet.</p>
          <p>
            Please email{" "}
            <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to
            request approval.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            City:
            <input
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Address:
            <input
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Postcode:
            <input
              name="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Latitude:
            <input
              name="lat"
              value={lat ?? ""}
              onChange={(e) =>
                setLat(
                  e.target.value === "" ? undefined : parseFloat(e.target.value)
                )
              }
              type="number"
              step="any"
            />
          </label>
          <br />
          <label>
            Longitude:
            <input
              name="lng"
              value={lng ?? ""}
              onChange={(e) =>
                setLng(
                  e.target.value === "" ? undefined : parseFloat(e.target.value)
                )
              }
              type="number"
              step="any"
            />
          </label>
          <br />
          <label>
            Website:
            <input
              name="website"
              value={website ?? ""}
              onChange={(e) => setWebsite(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Description:
            <textarea
              name="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Image URL:
            <input
              name="imageUrl"
              value={imageUrl ?? ""}
              onChange={(e) => setImageUrl(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Tags (comma separated):
            <input
              name="tags"
              value={tags.join(", ")}
              onChange={handleTagsChange}
            />
          </label>
          <br />
          <label>
            Operator:
            <input
              name="operator"
              value={operator ?? ""}
              onChange={(e) => setOperator(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Area:
            <input
              name="area"
              value={area ?? ""}
              onChange={(e) => setArea(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Phone:
            <input
              name="phone"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Borough:
            <input
              name="borough"
              value={borough ?? ""}
              onChange={(e) => setBorough(e.target.value || undefined)}
            />
          </label>
          <br />
          <label>
            Opening Hours:
            <input
              name="openingHours"
              value={openingHours ?? ""}
              onChange={(e) => setOpeningHours(e.target.value || undefined)}
            />
          </label>
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Add Pub"}
          </button>
        </form>
      )}
      {error && (
        <div>{typeof error === "string" ? error : JSON.stringify(error)}</div>
      )}
      {success && <div>{success}</div>}
    </div>
  );
}
