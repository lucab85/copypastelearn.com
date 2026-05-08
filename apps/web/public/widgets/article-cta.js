/*
 * CopyPasteLearn — Article CTA widget (T063 / US3).
 *
 * Drop into a sibling content site (AnsiblePilot, TerraformPilot, …) with:
 *
 *   <div data-cpl-cta
 *        data-product-slug="ansible-automation-playbook"
 *        data-title="Ansible Automation Playbook"
 *        data-blurb="60+ ready-to-paste plays for production fleets."
 *        data-cta-label="Get the playbook"
 *        data-brand="ansiblepilot"
 *        data-utm-source="ansiblepilot.com"
 *        data-utm-campaign="cta-2026q2"
 *        data-article-id="ansible-loops-deep-dive"></div>
 *   <script async src="https://copypastelearn.com/widgets/article-cta.js"></script>
 *
 * Every container is hydrated once. Best-effort `cta_view` and
 * `cta_click` analytics pings go to /api/analytics/cta on
 * copypastelearn.com (T065).
 */
(function () {
  if (typeof window === "undefined") return;
  var ORIGIN = "https://copypastelearn.com";
  var SEEN = new WeakSet();

  function ping(type, payload) {
    try {
      var body = JSON.stringify(Object.assign({ type: type }, payload));
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          ORIGIN + "/api/analytics/cta",
          new Blob([body], { type: "application/json" })
        );
        return;
      }
      fetch(ORIGIN + "/api/analytics/cta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body,
        keepalive: true,
        mode: "no-cors",
      });
    } catch (_e) {}
  }

  function buildHref(d) {
    var qs = new URLSearchParams();
    var brand = d.brand || "copypastelearn";
    var source =
      d.utmSource ||
      (brand !== "copypastelearn" ? brand + ".com" : "copypastelearn.com");
    qs.set("utm_source", source);
    qs.set("utm_medium", "article-cta");
    if (d.utmCampaign) qs.set("utm_campaign", d.utmCampaign);
    if (d.articleId) qs.set("utm_content", d.articleId);
    return ORIGIN + "/products/" + encodeURIComponent(d.productSlug) + "?" + qs.toString();
  }

  function readData(el) {
    return {
      productSlug: el.getAttribute("data-product-slug") || "",
      title: el.getAttribute("data-title") || "",
      blurb: el.getAttribute("data-blurb") || "",
      ctaLabel: el.getAttribute("data-cta-label") || "Get it now",
      brand: el.getAttribute("data-brand") || "copypastelearn",
      utmSource: el.getAttribute("data-utm-source") || "",
      utmCampaign: el.getAttribute("data-utm-campaign") || "",
      articleId: el.getAttribute("data-article-id") || "",
    };
  }

  function render(el) {
    if (SEEN.has(el)) return;
    SEEN.add(el);
    var d = readData(el);
    if (!d.productSlug) return;

    var brandLabels = {
      ansiblepilot: "AnsiblePilot",
      terraformpilot: "TerraformPilot",
      copypastelearn: "CopyPasteLearn",
    };
    var brandColors = {
      ansiblepilot: "#e11d48",
      terraformpilot: "#7c3aed",
      copypastelearn: "#18181b",
    };
    var brandLabel = brandLabels[d.brand] || "CopyPasteLearn";
    var color = brandColors[d.brand] || "#18181b";
    var href = buildHref(d);

    el.innerHTML =
      '<div style="margin:1.5rem 0;padding:1rem 1.25rem;border:1px solid #e4e4e7;border-radius:12px;background:#fff;display:flex;flex-direction:column;gap:0.75rem;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">' +
      '<div><div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">' +
      brandLabel +
      ' · CopyPasteLearn</div>' +
      '<h3 style="margin:0.25rem 0 0;font-size:18px;line-height:1.3;color:#18181b;">' +
      escapeHtml(d.title) +
      '</h3>' +
      '<p style="margin:0.25rem 0 0;font-size:14px;color:#52525b;">' +
      escapeHtml(d.blurb) +
      '</p></div>' +
      '<a data-cpl-cta-link href="' +
      href +
      '" style="align-self:flex-start;display:inline-block;padding:0.5rem 1rem;background:' +
      color +
      ';color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">' +
      escapeHtml(d.ctaLabel) +
      "</a></div>";

    var link = el.querySelector("[data-cpl-cta-link]");
    if (link) {
      link.addEventListener("click", function () {
        ping("cta_click", {
          productSlug: d.productSlug,
          brand: d.brand,
          utmCampaign: d.utmCampaign,
          articleId: d.articleId,
        });
      });
    }

    if ("IntersectionObserver" in window) {
      var seen = false;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !seen) {
            seen = true;
            ping("cta_view", {
              productSlug: d.productSlug,
              brand: d.brand,
              utmCampaign: d.utmCampaign,
              articleId: d.articleId,
            });
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 });
      obs.observe(el);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
          c
        ] || c
      );
    });
  }

  function init() {
    var els = document.querySelectorAll("[data-cpl-cta]");
    els.forEach(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
