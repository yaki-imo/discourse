import RawHtml from "discourse/widgets/raw-html";
import { iconHTML } from "discourse-common/lib/icon-library";
import getURL from "discourse-common/lib/get-url";
import QuickAccessPanel from "discourse/widgets/quick-access-panel";
import { ajax } from "discourse/lib/ajax";
import { createWidget, createWidgetFrom } from "discourse/widgets/widget";
import { h } from "virtual-dom";
import I18n from "I18n";

const ICON = "bell";

createWidget("no-quick-access-notifications", {
  html() {
    return h("div.empty-state", [
      h("span.empty-state-title", I18n.t("user.no_notifications_title")),
      h(
        "div.empty-state-body",
        new RawHtml({
          html:
            "<p>" +
            I18n.t("user.no_notifications_body", {
              preferencesUrl: getURL("/my/preferences/notifications"),
              icon: iconHTML(ICON),
            }).htmlSafe() +
            "</p>",
        })
      ),
    ]);
  },
});

createWidgetFrom(QuickAccessPanel, "quick-access-notifications", {
  emptyStateWidget: "no-quick-access-notifications",
  buildKey: (attrs) => {
    let key = "quick-access-notifications";
    if (attrs.revamped && attrs.notificationType) {
      key += `-${attrs.notificationType}`;
    }
    return key;
  },

  buildAttributes() {
    return { tabindex: -1 };
  },

  markReadRequest() {
    return ajax("/notifications/mark-read", { type: "PUT" });
  },

  newItemsLoaded() {
    if (!this.currentUser.enforcedSecondFactor) {
      this.currentUser.set("unread_notifications", 0);
    }
  },

  itemHtml(notification) {
    const notificationName = this.site.notificationLookup[
      notification.notification_type
    ];

    return this.attach(
      `${notificationName.dasherize()}-notification-item`,
      notification,
      {},
      { fallbackWidgetName: "default-notification-item" }
    );
  },

  findNewItems() {
    return this._findStaleItemsInStore().refresh();
  },

  showAllHref() {
    return `${this.attrs.path}/notifications`;
  },

  hasUnread() {
    return this.getItems().filterBy("read", false).length > 0;
  },

  _findStaleItemsInStore() {
    const params = {
      recent: true,
      silent: this.currentUser.enforcedSecondFactor,
      limit: 30,
    };
    let cacheKey = "recent-notifications";

    if (
      this.siteSettings.enable_revamped_notifications_menu &&
      this.attrs.notificationType
    ) {
      params.type = this.attrs.notificationType;
      cacheKey += `-${this.attrs.notificationType}`;
    }

    return this.store.findStale("notification", params, {
      cacheKey,
    });
  },
});
