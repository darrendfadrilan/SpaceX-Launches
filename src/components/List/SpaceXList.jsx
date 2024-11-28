import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./SpaceXList.css";
import Spinner from "../Spinner/Spinner";
import CompanyLogo from "../List/SpaceX_logo.png";

const SpaceXList = () => {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchLaunches = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.spacexdata.com/v4/launches/query",
        {
          query: {
            name: {
              $regex: searchQuery,
              $options: "i",
            },
          },
          options: {
            limit: 10,
            offset: (page - 1) * 10,
          },
        }
      );

      const fetchedData = response.data.docs;

      if (fetchedData.length === 0) {
        setHasMore(false);
      } else {
        setLaunches((prevLaunches) =>
          page === 1 ? fetchedData : [...prevLaunches, ...fetchedData]
        );
      }
    } catch (error) {
      console.error("Error fetching launches:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, hasMore]);

  useEffect(() => {
    fetchLaunches();
  }, [fetchLaunches]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop + 1 >=
      document.documentElement.scrollHeight
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchQueryChange = debounce((value) => {
    setLaunches([]);
    setPage(1);
    setHasMore(true);
    setSearchQuery(value);
  }, 300);

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const calculateTime = (date) => {
    const now = new Date();
    const launchDate = new Date(date);
    const diffInMs = launchDate - now;

    if (diffInMs > 0) {
      const hoursRemaining = Math.floor(diffInMs / (1000 * 60 * 60));
      const daysRemaining = Math.floor(hoursRemaining / 24);
      const yearsRemaining = Math.floor(daysRemaining / 365);

      if (hoursRemaining < 24) {
        return `${hoursRemaining} hour(s) remaining`;
      } else if (daysRemaining < 365) {
        return `${daysRemaining} day(s) remaining`;
      } else {
        return `${yearsRemaining} year(s) remaining`;
      }
    } else {
      const hoursPassed = Math.floor(-diffInMs / (1000 * 60 * 60));
      const daysPassed = Math.floor(hoursPassed / 24);
      const yearsPassed = Math.floor(daysPassed / 365);

      if (hoursPassed < 24) {
        return `${hoursPassed} hour(s) ago`;
      } else if (daysPassed < 365) {
        return `${daysPassed} day(s) ago`;
      } else {
        return `${yearsPassed} year(s) ago`;
      }
    }
  };

  const renderLinks = (links) => {
    const elements = [];

    if (links?.article) {
      elements.push(
        <a
          href={links.article}
          target="_blank"
          rel="noopener noreferrer"
          key="article"
        >
          Article
        </a>
      );
    }

    if (links?.webcast) {
      elements.push(
        <a
          href={links.webcast}
          target="_blank"
          rel="noopener noreferrer"
          key="video"
        >
          Video
        </a>
      );
    }

    return elements.length > 0
      ? elements.reduce((prev, curr) => [" | ", prev, " | ", curr])
      : null;
  };

  return (
    <div className="spacex-list">
      <div className="sticky-search-bar">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            onChange={(e) => handleSearchQueryChange(e.target.value)}
          />
        </form>
      </div>

      <div className="cards-container">
        {launches.map((launch) => (
          <div key={launch.id} className="card">
            <div className="card-header">
              <h3>{launch.name}</h3>
              <span
                className={`status-tag ${
                  launch.upcoming
                    ? "upcoming"
                    : launch.success === true
                    ? "completed"
                    : launch.success === false
                    ? "failed"
                    : "unknown"
                }`}
              >
                {launch.upcoming
                  ? "Upcoming"
                  : launch.success === true
                  ? "Completed"
                  : launch.success === false
                  ? "Failed"
                  : "Unknown"}
              </span>
            </div>
            {expandedCard === launch.id && (
              <div
                className={`card-details ${
                  expandedCard === launch.id ? "expanded" : "collapsed"
                }`}
              >
                <div className="image-wrapper">
                  <img
                    src={CompanyLogo}
                    alt="mission-patch-placeholder"
                    className="launch-patch-placeholder"
                    style={{ display: launch.imageLoaded ? "none" : "block" }}
                  />
                  <img
                    src={launch.links.patch.small}
                    alt={`${launch.name} patch`}
                    className="launch-patch"
                    onLoad={() => (launch.imageLoaded = true)}
                    style={{ display: launch.imageLoaded ? "block" : "none" }}
                  />
                </div>
                <div className="description-container">
                  <p>
                    {`${calculateTime(launch.date_local)}`}
                    {renderLinks(launch.links)}
                  </p>
                  <p>{launch.details || "No additional details available."}</p>
                </div>
              </div>
            )}

            <button
              className="view-button"
              onClick={() => toggleExpand(launch.id)}
            >
              {expandedCard === launch.id ? "Hide" : "View"}
            </button>
          </div>
        ))}
      </div>

      {loading && <Spinner />}
      {!loading && launches.length === 0 && searchQuery.trim() !== "" && (
        <p className="end-message">
          No Flight Record Found for "<strong>{searchQuery}</strong>"
        </p>
      )}
      {!loading && launches.length > 0 && !hasMore && (
        <p className="end-message">End of List.</p>
      )}
    </div>
  );
};

export default SpaceXList;
