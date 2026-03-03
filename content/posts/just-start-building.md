---
title: Just Start Building
date: 2026-02-27
description: The gap between idea and working software has never been smaller. The only thing left is to start.
---

You have an idea. You've had it for weeks. Months, maybe. You think about it in the shower. You think about it on the drive home. You open a blank file, stare at it, and close it again.

You tell yourself you need to do more research. You tell yourself the timing isn't right. You tell yourself you'll start on Monday.

Monday comes. You don't start.

This is not a planning problem. This is not a knowledge problem. This is Resistance.

## Resistance

Resistance is the force that sits between the idea in your head and the first line of code on your screen. It doesn't care how good your idea is. It doesn't care how talented you are. Its only job is to keep you from starting.

Resistance loves preparation. It loves Notion docs and colour-coded task boards and bookmarking tutorials you'll never watch. It loves anything that feels like work but produces nothing.

Resistance hates the terminal. It hates the blinking cursor. It hates the moment you open Claude Code or Cursor and type the first sentence describing what you want to build.

That's the moment it loses.

## The shift

The distance between an idea and working software used to be enormous. You needed months. You needed a team, or you needed to mass expertise in things that had nothing to do with your actual idea. The gap was so wide that Resistance barely had to try. Most people quit before they wrote a single line of code.

That gap has now closed.

The next generation of great software is not going to come from the companies with the biggest engineering teams or the deepest pockets. It's going to come from individuals and small teams. People with taste, with opinions, with a problem they actually care about solving, who happen to have access to tools that didn't exist two years ago. The playing field hasn't just levelled. It's flipped. A single person with conviction and the right tools can now outship a team of fifty who are building by committee.

People working day jobs who build at night and on weekends. People with an idea that won't leave them alone. People who are one terminal session away from turning that idea into something real.

## Not Monday. Today.

If you have a day job, you know the deal. You get home, you've got a couple of hours of real energy left. Resistance will happily fill those hours with anything other than the work. Not because you're lazy, but because starting is the hardest part. It always is.

So here's what you do. Not Monday. Today.

Open Claude Code, Cursor, or whatever AI tool you use. Describe the dumbest, most stripped-down version of your idea. Not the vision. Not the pitch deck. The version that does one thing and barely does it.

Then let it challenge you. Tell it to interview you about the idea. Why does this need to exist? Who is it actually for? What already does something similar? Let it ask the uncomfortable questions you've been avoiding. Sit with them. Answer honestly.

When I think about the projects I've shipped that actually worked, the ones that went somewhere, they all had one thing in common: I could explain the core of it in a single sentence. Cap records your screen, shares the link, and it's open source. That's it. Everything else came later. If you can't describe your idea simply, this interview process will force you to get there.

At the end of the session, tell the agent to write its findings to a markdown (.md) file.

## Fresh context

Take the markdown file and paste the path into a fresh session. The AI reads it cold. No memory of your last conversation. No assumptions. No attachment to the things you said that didn't quite make sense.

Ask it to interview you again. Ask for the pitfalls. Ask for the things you haven't thought about. Ask what a real version one looks like. Not the dream. The thing you could actually build in a weekend.

At the end, tell it to update the file.

## A living spec

Now turn it into a PRD. A product requirements document. Phases and tasks. Concrete enough that you could sit down right now and start working through them.

Here's where most specs die. You write a beautiful document, you start building, and by day two you've learned things the spec never accounted for. Edge cases. Dependencies. Better approaches you only discovered by doing the work. The PRD just sits there, frozen, a relic of what you knew before you started.

It doesn't have to be that way.

When you structure your PRD correctly, you can instruct the agent to update it as you build. Finish a task, spin up a sub-agent whose only job is to take what was learned during implementation and feed it back into the spec. New edge cases get added. Task descriptions get refined. The order and flow gets adjusted. The document evolves alongside the code instead of falling behind it.

You write this instruction into the PRD itself. "When you finish a task, take your learnings, update the relevant sections, adjust anything downstream."

By the time the project is done, the spec isn't an outdated document from week one. It's an accurate record of what was built and why.

## The work

Once your PRD is solid, you work through it. One task at a time. Open your tool, point it at the spec, and tell it to pick up the next incomplete task, and only that task. Let it finish. Review the work. Make sure you understand what happened and why. Then move to the next one. You stay in the loop. You course-correct in real time. The agent does the heavy lifting, but you're the one steering.

This is important. The people who treat AI agents like a magic "build my app" button end up with code they don't understand and can't maintain. The people who treat them like a very fast junior developer, someone who needs clear direction and regular check-ins, end up with something they can actually ship.

If you want to go fully hands-off for certain stretches, tools like Ralphy exist for that. It's an open source bash script that runs AI coding agents in a loop until your task list is complete. It picks up tasks, executes them, marks them done, moves on. Branching, retries, parallel execution. You point it at your PRD and let it run while you sleep or while you're at work.

The people I know who are shipping the most right now aren't the ones with the most free time. They're the ones who figured out how to compress the work. Two focused hours at night with an AI agent can produce what used to take two weeks. And the people who figure this out now, while most of the world is still debating whether AI is overhyped, are the ones who will build the next generation of software people actually want to use.

## The only thing

None of this matters if you don't open the terminal. The tools exist. The process is simple. The gap between idea and working software has never been smaller. But Resistance doesn't care about any of that. Resistance only needs you to hesitate.

So don't.

Open the terminal. Copy this post as the first prompt. Start.

---

*This post was heavily inspired by Steven Pressfield's The War of Art, a book about the invisible force that keeps us from doing the work we were meant to do. If you haven't read it, read it. I thoroughly enjoyed it.*
