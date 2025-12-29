# Project Title: Habit Arcade POC
# Start Date: 12/28/25

# Scope:

Habit Arcade is a critical piece in our bigger Life OS style suite of apps that will cross integrate.  While the backend and foundations needed for that are being built by other teams.  I want this team to build out our POC so we can test out systems, theories, methods, etc.  for a month or two and then see how they work and what works what needs afjsutment.  And then this will get rebuilt on our AppBrain architectue.  So this version just needs to be single user and don't worry about making something that will be solid for years, this is the Proof of Concept jsut to test the app fundamentals and concepts.  And then we will make the more refined more scalable system later on our Core platform that integrates with our Life OS Suite.


# Notes:
 - Initially doing Light mode only
 - Desktop First Design
 - WIll often be used as wall board
 - For Habits Allow the user to do "offset days". By this I mean we don't jsut treat midnight local to the user as always the end of a day.  Some items the user might want tied to their "awake" days.  For example I usually go to bed between 1 AM and 5 AM.  And get up between 9AM and 1 PM.  So for me for many items my day woudl reset at 6 AM instead of midnight when practical/possible.

# Terminology
  - Categories - High Level Categories of Data Types (i.e. Health, Finance, Work, House, Family, Social, Self-Improvement, etc.)
  - Data Types: There are several different data types
    - Habits - Things that the user repeats almost daily (i.e. Brush Teeth, Eat Healthy, Spend 20 minutes on personal growth)
    - Tasks - Items that are done once or occasionally (Clean Kitchen, Pay Bills, )
      - Traditional Tasks - Regular single time tasks
      - Sub-Tasks - Tasks that are children of other tasks
      - Maintenance Tasks - Items that will need to be done occasionally, but on a repeasted schedule (take out trash, clean humidifier, replace HVAC filter, clean fridge)
    - Projects - Collection of Tasks that are related to acheiving a common goal
    - Measurements - Tracked items that measure specific features or activity (i.e. weight, daily steps, count of days task completed, total exercise minutes, total fasting hours)
    - Goals - Things we are trying to acheive, that then will have tasks, habits, or measurements tied to acheiving the Goal
    - Priorities - List of Tasks that the user is focusing on for specified period.
    - Target - An Objective for a measured item


# UI/UX Notes
  - Likely best to use FlyonUI Application Shell 5 as start - https://flyonui.com/blocks/dashboard-and-application/application-shell#application-shell-5
  - 


# Data Types Details

## 1. Category Management
   - Category examples: Finance, Health, House, Family, Social, Church, Programming, Next Level Foundry, Content Creation
   - Each category has a color associated it with it
   - Each category has an icon associated with it
   - Categories applies to goals, habits, tasks, projects, measurements, etc

## 2. Project Management
  - Projects are cluster of tasks that will take quite some time to complete or may be perpetual (Software I am building and hoping to turn into a SaaS)
  - Examples: Software Development Projects, Seasonal Garden, Reorganize Second Bedroom, Develop Course, Volunteer Work for Church, etc.
  - Projects can have child/parent projects
  - Projects can have tags associated with them.
  - Projects have:
    - Project ID
    - Title
    - Description
    - Start Date
    - Target Completion Date
    - Category
    - Icon (optional)

## 3. Tag Management
  - Tag name
  - Tag Color
  - Tag Category (optional)
  - Tag Icon

## 4. Habits
  - Habit Title
  - Goal (linked field) - What is the expected number of positives per interval
  - Habit Header
  - Habit Sub-Header
  - Parent Habit
  - Start Date
  - Category

## 5. Tasks
- Task Properties:
  - Task ID
  - Task Name
  - Start Date
  - Category
  - Status
  - Priority
  - Project
  - Parent Task
  - Description
  - Notes
  - Links - Web URLs related
  - Color
  - Tags
    - Some Tags will have special purposes like WhileOut Are tasks that can only be done when not home
    - Some tags will be auto generated
  - Priority
  - Reminder
    - Remind Date/Time
  - Media
  - Assignee (for now all me)
  - Planned Date - The day the user plans to do the task
  - Firm Due Date - Day by which it must be done if there is a hard deadline
  - Recurring
    - Recurring Frequency
    - End Date
    - Related Task IDs


## 6. Goals
  - Goal Title
  - Goal Summary
  - Linked Elements
  - Goal Icon

## 7. Measurements (name of measurements, not the specific values)
  - Measurement title
  - Measurement Unit
  - Expected Update Frequency
  - Enable Reminders
  - Start Date
  - Linked Goals
  - Linked Targets

## 8. Targets
  - Target Name
  - Linked Measurement
  - Linked Measurement Units
  - Initial Value
  - Initial Date
  - Target Value
  - Target Date
  - Intermediate Targets (array of addtional sub-targets between dates)

## 9. Task Status Options
  - Allow user to set and edit statuses
  - Default Statuses: 0-Not Started, 1-In Progress, 2-On Hold, 3-Blocked, 9-Done, 99-Abandoned/Archived

## 10. Habit Status Options (see list in Habits Matric)

## 11. Priority Options
  - Allow user to set Priorities
  - Allow user to set icon for priority



# Data Views

1. Habit Matrix
2. Task Views
   1. List View
   2. Detailed List view
   3. Kanban - Week View
   4. Kanban - Project View
   5. Kanban - Category View
   6. Kanban - Status View
3. Goals View
4. Time Period Goals
5. Time Period Priorities
6. Goal & Project Priority List
7. Maintenance Tasks
8. Target Graphs
9. Event Duration Trackers (Fast Tracker)
10. Timed Goals
11. Health Metrics
    1.  Weight Tracker
    2.  Step Tracker
    3.  Sleep Tracker
    4.  Exercise Tracker


# Data Views Details

## 1. Habit Matrix

### Overview:

- A grid view where each row is a "Habit" and each column is a day. As the user completes each "Habit" they mark it complete (green). Any items missed at the end of the day is marked incomplete (red).  This allows the user to visually track their habits. 
- Psychologically, it is easy as a user to think that we are doing healthy and productive habits more often than we actually do.  For example, it is easy to say I eat mostly healthy lately, but in reality its been weeks since you have eaten healthy, gone to the gym, did your exercises, etc.  And suddenly a day or two skipped becomes weeks or months.  It is also easy to forget all the things that we should get done nearly every day.  So having a checklist is a good way to make sure you did all the things you should have done in the day. There is also a psychological benefit to having to mark the items green every day. Otherwise it's easy to be like, "I'll skip it today, I'll do it tomorrow." But having to mark it red makes you feel bad and guilty about it. That kind of tricks you into "let me just do it quickly now."

### Sample Images:
 - Start of Month: imports/images/SampleHabit-Matrix.png
 - Partially filled printed form: imports/images/wallboard-filled.jpeg
 - Github Graph for Deep Dive: imports/images/PNG image 2.png

### Details:
- Habits can have Categories, Sub-Categories, and Sub-Sub Categories.
- Habits can have tagged (which might tie into things like our projects, or making smart dashboards in the future)
- Some Habits are expected to happen every single day.
- Some Habits will be expected to happen x times per week, or x times per month.
- Default view is Monthly, but we will offer weekly for mobile and widgets later on.
- Habits are Rows, and then there is a cell for every day of the time period (month) which has a white background and a light gray number for the day number.
- Each day the user will mark the status for that habit on that day using our color scheme.
- We will do "Roll up" Metrics like what percentage of the days the user completed the task
- We want to set the expectation that it is ok to skip a day sometimes, but it is rarely a good idea to skip 2 days.
- Habits may come and go over time or change slightly like how often or wording. But we still need to log historical habit patterns
- We want to keep long term habit score by category

#### Visual Layout:
- The module/widget is a grid layout. Default view is month view, but there will be a week view on mobile and on dashboards in teh life OS app
  = High level concept, Habit names are rows and on the left side of the screen. They are then followed by cells for every
  - Far Left: Categories and Sub Category Headers rotated 90 degrees counter clockwise (we might move this to some form of header rows if that becomes easier)
  - Habit Name:
  - Matrix of the days of the time period (default is month)
- By default habits have 5 states: (colors mean mostly the background and then the text should only be partially visible throuogh it)
  - Empty - White cell background light gray text with the day nig default prior to the day
  - Complete - Emerald Green
  - Missed - Red - I want to say Failed, but Failed is too harsh.  Got to work on a better term for this 
  - Exempt - Blue - Exemption granted - for example I have the flu I should not do my exercises. I am having a high pain day. Etc.
  - N/A - medium gray - The habit should not be performed on that day by design for example some things might be either/or like Exercise at home or go to gym, so if I mark one the other is N/A. Or eat 50% Fiberous Vegetables, but its a fasting day. I am out of town so I can't clean house ofr 20 minutes
- Addition Optional States
  - Extra - Dark Green - User went above and beyond that day. like did douuble exercise target
  - Dark Gray/Red - Some items will have lower targets like Fasting the goal is 8 days per month.  so there will be a lot of Dark Grays, but if it gets to the point where I am trending to not make the target, these start becoming red instead until the trend improves.
  - Yellow/Orange - Partial Effort but had to abort for good reason. 
  - Pink - User can enable a if I don't fill out by end of the day set it to pick to mark it as I likely missed it.  Hopeing this encourages them to the go back and make sure they fill in the ones they did at least.
  - Number - Some items might have a target Number and the color might be on shades of green up to the number.  For example on a Fasting Day, I should have 3 LMNT supplements.  so varying shade of green building up until the count is complete.

#### Rollup
  - Part of our goal is to be able to provide roll up metrics, like percent completed out of the month
  - Also some habits will not be expected to do every day (fasting, go to gym, etc). so we need to have a way to show "good job" even though there are missed days (part of the exemption and gray colors)
  - We want to be able to have an annual view on habits and you see the percent for the month absolute and percent for month out of target.  Liek fasting will be 8 or 10 days a month targetted so 4 days is 50% out of 8 days, not 4 out of 30 days. 
  - We want to use the Rollup so at least the person can track well I hit only 50% of my habits each day last month.  but this month I hit 62% so I made progress. 

#### Habit Setup:
  - We want to have traditional add a habit and add a category through traditional forms. 
  - We also want to let users bulk manage and load/update them in an easy format.  I like the idea of Markdown, but we will need to discuss as there are a lot of parameters now not jsut a simple add it.
  - For a start sample markdown and habits to start with for development use: imports/sample-habits.md

#### User Interactions:
  - Some Habits will be "expand/collapsible" so that they can have a list of sub-habits.
  - When hovering on the name of the habit there will be a "deep dive" action link to see the deeper dive stats.
    - Deep Dive of the habit will have a Github style graph view of the performance 
    - It will have details like when it was added, what it is linked to, ability to edit the habit
  - By default clicking on the date cell for a habit should cycle it through (started as White) Completed, Missed, Blank.  But hovering over it for than a second shoudl give a pop up tooltip below it. Similar to this image: imports/images/SampleHabit-Matrix-Tooltip+Highlght copy.png
  - Mousing Over should highlight row and column like a 20% yellow to help keep track of where you are.


## 2. Task Views

## 2.1 List View
  - Standard List View (like a bulleted list) of Check Boxed Tasks
  - Can be grouped by Project, Category, Due Date, Status
  - Checking the check box puts a strike through

## 2.2 Detailed List View
  - Advanced Data Table 
    - FlyOnUI Block Datatable 2 - https://flyonui.com/blocks/datatable/datatable-component#datatable-1
    - But use column filters like FlyonUI Component Column Filter - https://flyonui.com/docs/third-party-plugins/datatables/#column-filter
    - Nested Child Tasks in List View
    - Allow in-line editting
    - Need to be careful about selection for multiple row selection versus marking complete.

## 2.3 Kanban Tasks - Week View
  - Kanban Board but the columns are fixed days of the week, Sun - Sat
  - Uses the Planned Date field for the day the user plans to do the task
  - Supports horizontal swimlines (can be status, project, Goal)
  - Child Tasks are nested under Parents
  - Entries on hover have icon to trigger expand or modal to view full details and to go to edit mode.
  - View Options:
    - List vs Compact Card vs Standard Card - Just the Title, or full project card
      - Card View user can pick fields to include: Tag, Project (as icon or tag), Category (as icon or tag)
      - Compact Card
        - First Line: Task Name in far right icons for Priority, Project, Category, Links, Media, Status.
        - Second Line: Due Date, Tags
      - Link and Media indicator if there are any.
    - Allow user to color code text by Category or Project Color
  

## 2.4 Kanban - Project View
  - Similar to 2.3 Kanban - Week View, except Kanban Columns are Projects
   
## 2.5 Kanban - Category View
  - Similar to 2.3 Kanban - Week View, except Kanban Columns are Category
 
## 2.6 Kanban - Status View
  - Similar to 2.3 Kanban - Week View, except Kanban Columns are Status

## 2.7 Kanban - Goals View
  - Similar to 2.3 Kanban - Week View, except Kanban Columns are Goals


## 3 Goals View
  - View List of Goals
  - Allow Group by time period (week, month, quarter, year, life)
  - Allow filtering


## 4. Time Period Goals
  - Sample Time Period (Weekend, Weekly, Month, Quarter, Years)
  - Have the user specify Goals/Objectives.
  - Goals can have Tasks, Habits, Measurement & Priorities tied to them
  - Encourage the users to periodically (like start of week, month, quarter, year, season) set goals and objectives
  - Goals can have primary goal, and "reach" goals
  - Each Habit should have a goal set to set expectation like expected everyday, expected 25 days a month, expect 3 timers per week
  - Goals can have parent/child goals
  - Examples:
    - End 2026 below 320 lbs or less. Reach Goal End under 300 lbs
    - Walk at least 4,000 steps 10 days per month
    - Keep my house in better order. Sub-goal: Spend 20 minutes per day improving 1 procrastinated task. Spend 20 minutes per day cleaning on just 1 room.
    - 

## 5. Time Period Priorities
  - For the specified time period, what is the Priorities
  - At start of week, have the User speify these are the "Priorities"
  - Tasks that are the priority to get done this week.
  - Want to keep this on the main dashboard

## 6. Goal & Project Priority List
  - Tie tasks and projects into a priority for a specific Goal/Habit.
  - For example: I'm going to have a habit of spending 30 minutes per day cleaning house. I want to have a priority list as I'm going to have 50 tasks that are house cleaning and might be tied to different projects like: clean living room, clean kitchen, organized garage, redo lower kitchen cabinets, etc.  SO I would set a priority list so that when I start the "Timed Tasks" my goal is to focus on just the top 2 or 3 priorities on this list and not stray into other things that need to be cleaned.
  - Other Sample: Which Coding Project priority order is, What are the top priorities in my garden if I spend time in the garden

## 7. Maintenance Tasks
  - Tasks that need to be done on a regular repeat basis.
  - We don't want to crowd or "task list" of one-off tasks and project tasks with the recurring maintenance tasks most of the time.
  - Examples:
    - Weekly, Laundry
    - Once per 2 months replace water filter 
    - Once every 3 months replace HVAC filter
    - Once per month, clear car
    - 2x week, dishes
    - once per week trim nails
    - once per month haircut

## 8. Target Line Graph

### Overview:

- User sets a start date, an end date, a start value, and end value. Then they have the ability to track their progress along the way. They can also set midpoint targets and the goal is to see whether or not the user is hitting those targets along the way.

### Details:

- All trackers must have start date and end date
- Graph has a "target" line between the start point and the end point. This way the user can track their progress over time as they aim for their objective.
- Some items being above the graph is good, some items being below the graph is good.
- Some data will be sourced potentially by the habit matrix to auto populate.
- Any Habit matrix item can be viewed this way.
- User can set a main objective and also a "reach" objective.
- If the user is "off course" there should be warning notifications and color changes
- The user can set a minimum update schedule, and if there is no value by the specified window, the system will provide a notification. For example, I am supposed to log my weight at least once per week.  If It is day 8 and I have not logged my weight yet, the system sends me a reminder notification.

### Examples:
- Weight Loss:  I will likely be 380 pounds on 1/1/2026.  My goal is by 12/31/2026 to be under 320 lbs.  and my reach goal is to be under 300 lbs. I will be weighing in about once per week, and I want to track if I am progressing well throughout the year to meet the objective, or am I off course. If no value for 8 days, it gives a notification. If 15 days, more severe notification alerts.  Ideally the trend light is either slightly logrithmic or we set multiple target points to create a slightly curved slope.  Losing more pounds per week is easier earlier in the process.  so 2 lbs/week for the first 3 months, 1.6 lbs per week 2nd quarter, 1.3 lbs/week 3rQ, 1 Lb/wk for 4th Qtr type of curve either byt these manual points or logrithmic curve
- Fasting: Habit Matrix will have fasting days on it.  We will be targeting 8 fasting days per month minimum, we log the events via the habit matrix but can deep dive from habit matrix and see a Github calendar style graph with all the days for the month, and a Target Line Graph to see if by mid month is at at least 4 events. so it would be "aggregate days per month" graph not just is that day an event.  so If I fast days 5,6,12,13,14: the graph will be 0 until day 5, then go up to 1, day 6 it goes to 2, days 7-11 it stays at 2, then it goes up each of the following days by 1.

## 9. Event Duration Trackers

### Overview:
- Sometimes we want to log sessions of things and then keep those sessions logged and be able to aggregate our total time or total values in different ways. This is an easy way to track and then see the results of those events.
- Original use case I had in mind was my fast tracking. So whenever I'm doing a nutritional fast, I want to just log the start point of that fast and then the endpoint of that fast. There might be a metric with subpoints along the way. For example with the fasting one, I log my weight periodically throughout the fast as a data point. So we should allow data points that we capture in other ways as well as data points that we capture just for this purpose.

## Details:
- Key values: Start Time, End Time, Duration hrs, Duration in minutes, duration in days
- We might offer "Types" which could be different levels, or related items.  For example If I do a 3 day water fast, I might then do a 2 day Carnivore diet that is protein and fat centric, and then go back into a pure 2 day water fast.  So combined I am in insulin depletion mode for 7 days, but there are differing segments.
- Adding a fast on here can be linked to a Habit Matrix event of a "fasting day" (as long as at least 14 hours of the 24 hours of the day are part of the fasting window). 
- Vice versa, is I mark a day as a "fasting day" on the Habit Tracker, it should then ask if I want to add it to the fast tracker if they are set as linked habits.
- Adding values to other trackers can impact here as well. For example with my weight, I will often log it every day of a fast, so then a deep dive on any particular fast I would see a table and/or chart of my weights before, during, and after the fast (first number before and first number after).

## 10. Timed Habits
- Timed Habits are when the user has habits that are spend certain amount of time daily on a habit
- Examples:
  - 30 minutes a day of exercise
  - 20 minutes a day of improving the house
  - 10 minutes a day reading
  - 10 minutes a day meditating
  - 20 minutes a day on self improvment
  - Spend 30 minutes a day on Software Projects
- For these, the user should be able to trigger a screen/widget that gives them a timer and shows whatever Priorities they have set for that item.
  - For example if 30 minutes a day on software projects, I have a current software project priorityy list that lists all the projects in this realm and lets me prioritize them.  and during the timer it lets me control the timer and also shows the top 2 priorities to remind me I should only focus on those 2 projects.

## 11. Health Metrics
  - VIew for the various health metrics once we can get them.
  - Weight is worth manually duplicating.
  - Fasting we will have from timed trackers
  - We can have our own exercise tracker tied to our habits (steps, exercise minutes, etc.)
  - In future hoping to get Apple HealthKit data for Steps, Sleep, Exercise, etc.


