import { Fragment } from "react";
import { Link } from "react-router";

function AccessPageHeader({
  title,
  countLabel,
  backTo,
  backLabel,
  metadata = [],
}) {
  return (
    <header
      className={
        "board-header access-page-header"
      }
    >
      <div className="board-header__identity">
        <Link
          to={backTo}
          className="project-header__back"
          aria-label={backLabel}
          title={backLabel}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>

        <div className="board-header__details">
          <div className="project-title-row">
            <h1>{title}</h1>

            {countLabel && (
              <span className="project-task-count">
                {countLabel}
              </span>
            )}
          </div>

          {metadata.length > 0 && (
            <div
              className="project-header__metadata"
              aria-label={`${title} information`}
            >
              {metadata.map(
                (metadataItem, index) => (
                  <Fragment
                    key={
                      `${metadataItem.label}-` +
                      `${index}`
                    }
                  >
                    {index > 0 && (
                      <span aria-hidden="true">
                        ·
                      </span>
                    )}

                    <span
                      className={
                        metadataItem.className
                      }
                    >
                      {metadataItem.label}
                    </span>
                  </Fragment>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AccessPageHeader;