document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants:";
        participantsSection.appendChild(participantsTitle);

        const participantList = document.createElement("ul");
        participantList.className = "participants-list";

        if (participants.length > 0) {
          participants.forEach((email) => {
            const item = document.createElement("li");
            item.className = "participant-item";

            const emailText = document.createElement("span");
            emailText.className = "participant-email";
            emailText.textContent = email;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "participant-delete";
            deleteButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
            deleteButton.title = `Remove ${email}`;
            deleteButton.innerHTML = "✕";
            deleteButton.addEventListener("click", async () => {
              try {
                const deleteResponse = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const deleteResult = await deleteResponse.json();

                if (!deleteResponse.ok) {
                  throw new Error(deleteResult.detail || "Unable to unregister participant.");
                }

                messageDiv.textContent = deleteResult.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
                await fetchActivities();
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
                console.error("Error unregistering participant:", error);
              }
            });

            item.appendChild(emailText);
            item.appendChild(deleteButton);
            participantList.appendChild(item);
          });
        } else {
          const emptyItem = document.createElement("li");
          emptyItem.className = "empty";
          emptyItem.textContent = "No participants yet";
          participantList.appendChild(emptyItem);
        }

        participantsSection.appendChild(participantList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
